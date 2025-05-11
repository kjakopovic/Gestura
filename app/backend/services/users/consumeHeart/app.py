import logging
import os

from datetime import datetime, timedelta, timezone
from common import build_response
from middleware import middleware
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE
from auth import get_email_from_jwt_token, check_users_subscription

logger = logging.getLogger("ConsumeHeart")
logger.setLevel(logging.DEBUG)

# Time in hours before a heart is refilled, retrieved from environment variables
HEARTS_REFILL_RATE_HOURS = int(os.environ.get("HEARTS_REFILL_RATE_HOURS", 3))


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    # Extract JWT token from headers and authenticate user
    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    # Initialize DynamoDB client for the users table
    global _LAMBDA_USERS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

    # Retrieve user's hearts data from database
    user_item = get_user_by_email(dynamodb, email)
    if not user_item:
        logger.debug(f"User with email {email} not found.")
        return build_response(404, {"message": "User not found."})

    is_premium = check_users_subscription()

    if is_premium:
        logger.debug(f"User {email} is a premium user, unlimited hearts.")

        return build_response(
            200,
            {
                "message": "Heart consumed successfully",
                "data": {"hearts": 5, "hearts_next_refill": None},
            },
        )

    hearts = user_item.get("hearts", 5)
    hearts_next_refill = user_item.get("hearts_next_refill", None)

    # Check if user has any hearts to consume
    if hearts == 0:
        logger.debug(
            f"Unable to consume a heart for user: {email} as they have no hearts left."
        )
        return build_response(
            400, {"message": "Unable to consume a heart as they have no hearts left."}
        )

    # Variables to store updates for DynamoDB
    next_refill = None
    update_expression = None
    expression_attribute_values = None

    current_time = datetime.now(timezone.utc)

    # Case 1:
    # User has full hearts (5/5), consume one and set first refill timer
    if hearts == 5:
        # Calculate next refill time when consuming first heart
        next_refill = (
            current_time + timedelta(hours=HEARTS_REFILL_RATE_HOURS)
        ).isoformat()
        hearts -= 1
        update_expression = "SET hearts = :val, hearts_next_refill = :refill_time"
        expression_attribute_values = {":val": hearts, ":refill_time": next_refill}

        logger.debug(f"User {email} has hearts next refill time in the future.")

    # Case 2:
    # User has partial hearts and refill time has passed
    elif (
        hearts < 5
        and hearts_next_refill
        and datetime.fromisoformat(hearts_next_refill) < current_time
    ):
        logger.debug(f"User {email} has hearts next refill time in the past.")

        # Calculate next refill time based on previous refill time
        hearts_next_refill_dt = datetime.fromisoformat(hearts_next_refill)
        next_refill = (
            hearts_next_refill_dt + timedelta(hours=HEARTS_REFILL_RATE_HOURS)
        ).isoformat()
        update_expression = "SET hearts_next_refill = :refill_time"
        expression_attribute_values = {":refill_time": next_refill}

        logger.debug(f"Setting next heart refill time to {next_refill}")

    # Case 3:
    # User has partial hearts and is waiting for next refill
    elif hearts < 5 and datetime.fromisoformat(hearts_next_refill) > current_time:
        # Just consume a heart, keep existing refill time
        hearts -= 1
        next_refill = hearts_next_refill
        update_expression = "SET hearts = :val"
        expression_attribute_values = {":val": hearts}

    # Update the user's hearts data in DynamoDB
    dynamodb.table.update_item(
        Key={"email": email},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
    )

    # Return successful response with updated heart data
    return build_response(
        200,
        {
            "message": "Heart consumed successfully",
            "data": {"hearts": int(hearts), "hearts_next_refill": next_refill},
        },
    )


def get_user_by_email(dynamodb, email):
    """
    Retrieve user's heart data from DynamoDB by email address.

    Parameters:
        dynamodb (LambdaDynamoDBClass): DynamoDB client for users table
        email (str): User's email to look up

    Returns:
        tuple: (hearts, hearts_next_refill) if user exists, None otherwise
    """
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})

    if user_item:
        return user_item
    else:
        logger.error(f"User with email {email} not found")
        return None
