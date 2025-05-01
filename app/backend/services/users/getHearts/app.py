import logging
import os

from datetime import datetime, timedelta, timezone
from common import build_response
from middleware import middleware
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE
from auth import get_email_from_jwt_token

logger = logging.getLogger("GetHearts")
logger.setLevel(logging.DEBUG)

HEARTS_REFILL_RATE_HOURS = int(os.environ.get("HEARTS_REFILL_RATE_HOURS", 3))


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    jwt_token = event.get("headers").get("x-access-token")
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

    hearts, hearts_next_refill_str = user_data

    if hearts == 5:
        logger.debug(f"User with email {email} has 5 hearts")
        return build_response(
            200,
            {
                "message": "Fetched hearts successfully",
                "data": {"hearts": int(hearts), "hearts_next_refill": None},
            },
        )

    current_time = datetime.now(timezone.utc)
    logger.debug(f"Current time: {current_time}")

    hearts_next_refill = None

    if hearts_next_refill_str:
        try:
            hearts_next_refill = datetime.fromisoformat(hearts_next_refill_str)
        except (ValueError, TypeError):
            logger.error(f"Invalid hearts_next_refill format: {hearts_next_refill_str}")
            hearts_next_refill = current_time - timedelta(hours=1)

    filled_hearts = False

    if hearts_next_refill <= current_time:
        time_delta = current_time - hearts_next_refill
        hours_elapsed = time_delta.days * 24 + time_delta.seconds // 3600
        hearts_to_add = min(hours_elapsed // HEARTS_REFILL_RATE_HOURS + 1, 5 - hearts)

        hearts += hearts_to_add
        filled_hearts = hearts_to_add > 0

        if hearts < 5:
            hearts_next_refill = current_time + timedelta(
                hours=HEARTS_REFILL_RATE_HOURS
            )
        else:
            hearts_next_refill = None
            hearts = 5

    if filled_hearts:
        update_expression = "SET hearts = :hearts"
        expression_attribute_values = {":hearts": hearts}

        if hearts_next_refill:
            update_expression += ", hearts_next_refill = :hearts_next_refill"
            expression_attribute_values[":hearts_next_refill"] = (
                hearts_next_refill.isoformat()
            )
        else:
            update_expression += ", hearts_next_refill = :null_value"
            expression_attribute_values[":null_value"] = None

        dynamodb.table.update_item(
            Key={"email": email},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
        )

    response_data = {
        "hearts": int(hearts),
        "hearts_next_refill": (
            hearts_next_refill.isoformat() if hearts_next_refill else None
        ),
    }

    logger.debug(f"Fetched hearts for user: {email}. Remaining hearts: {hearts}")
    return build_response(
        200, {"message": "Fetched hearts successfully", "data": response_data}
    )


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})

    if user_item:
        hearts = user_item.get("hearts", 5)
        hearts_next_refill = user_item.get("hearts_next_refill", None)
        return hearts, hearts_next_refill
    else:
        logger.error(f"User with email {email} not found")
        return None
