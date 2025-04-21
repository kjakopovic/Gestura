import logging
import os

from datetime import datetime, timedelta
from common import build_response
from middleware import middleware
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE
from auth import get_email_from_jwt_token

logger = logging.getLogger("ConsumeHeart")
logger.setLevel(logging.DEBUG)

HEARTS_REFILL_RATE_HOURS = int(os.environ.get('HEARTS_REFILL_RATE_HOURS', 3))


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    jwt_token = event.get("headers").get("x-access-token")
    print(f"JWT token: {jwt_token}")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    global _LAMBDA_USERS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

    user_data = get_user_by_email(dynamodb, email)
    if not user_data:
        logger.debug(f"User with email {email} not found.")
        return build_response(404, {"message": "User not found."})

    hearts, hearts_next_refill = user_data

    if hearts == 0:
        logger.debug(f"Unable to consume a heart for user: {email} as they have no hearts left.")
        return build_response(400, {"message": "Unable to consume a heart as they have no hearts left."})

    next_refill = None
    update_expression = None
    expression_attribute_values = None

    if hearts == 5:
        next_refill = (datetime.now() + timedelta(hours=HEARTS_REFILL_RATE_HOURS)).isoformat()
        hearts -= 1
        update_expression = "SET hearts = :val, hearts_next_refill = :refill_time"
        expression_attribute_values = {":val": hearts, ":refill_time": next_refill}

        logger.debug(f"User {email} has hearts next refill time in the future.")

    elif hearts < 5 and hearts_next_refill < datetime.now().isoformat():
        logger.debug(f"User {email} has hearts next refill time in the past.")
        hearts_next_refill_dt = datetime.fromisoformat(hearts_next_refill)
        next_refill = (hearts_next_refill_dt + timedelta(hours=HEARTS_REFILL_RATE_HOURS)).isoformat()
        update_expression = "SET hearts_next_refill = :refill_time"
        expression_attribute_values = {":refill_time": next_refill}

        logger.debug(f"Setting next heart refill time to {next_refill}")
    elif hearts < 5 and hearts_next_refill > datetime.now().isoformat():
        hearts -= 1
        next_refill = hearts_next_refill
        update_expression = "SET hearts = :val"
        expression_attribute_values = {":val": hearts}

    dynamodb.table.update_item(
        Key={"email": email},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
    )

    return build_response(
        200,
        {
            "message": "Heart consumed successfully",
            "data": {
                "hearts": int(hearts),
                "hearts_next_refill": next_refill
            },
        }
    )


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})

    if user_item:
        hearts = user_item.get("hearts", 5)
        hearts_next_refill = user_item.get("hearts_next_refill", None)
        return hearts, hearts_next_refill
    else :
        logger.error(f"User with email {email} not found")
        return None