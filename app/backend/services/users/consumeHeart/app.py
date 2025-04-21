import logging

from datetime import datetime, timedelta
from common import build_response
from middleware import middleware
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE
from auth import get_email_from_jwt_token

logger = logging.getLogger("ConsumeHeart")
logger.setLevel(logging.DEBUG)


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

    hearts -= 1

    update_expression = "SET hearts = :val"
    expression_attribute_values = {":val": hearts}

    if hearts == 4 or (hearts <5 and not hearts_next_refill):
        next_refill = (datetime.now() + timedelta(hours=3)).isoformat()
        update_expression += ", hearts_next_refill = :refill_time"
        expression_attribute_values[":refill_time"] = next_refill
        logger.debug(f"Setting next heart refill time to {next_refill}")

    dynamodb.table.update_item(
        Key={"email": email},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
    )

    logger.debug(f"Consumed a heart for user: {email}. Remaining hearts: {hearts}")
    return build_response(
        200,
        {
            "message": "Heart consumed successfully",
            "data": {
                "hearts": int(hearts),
                "hearts_next_refill": expression_attribute_values.get(":refill_time", hearts_next_refill)
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