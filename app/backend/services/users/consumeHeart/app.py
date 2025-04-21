import logging

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

    hearts = get_user_by_email(dynamodb, email)

    if not hearts:
        logger.debug(f"User with email {email} not found.")
        return build_response(404, {"message": "User not found."})

    if hearts == 0:
        logger.debug(f"Unable to consume a heart for user: {email} as they have no hearts left.")
        return build_response(400, {"message": "Unable to consume a heart as they have no hearts left."})

    hearts -= 1

    dynamodb.table.update_item(
        Key={"email": email},
        UpdateExpression="SET hearts = :val",
        ExpressionAttributeValues={":val": hearts},
    )

    logger.debug(f"Consumed a heart for user: {email}. Remaining hearts: {hearts}")
    return build_response(
        200,
        {
            "message": "Heart consumed successfully",
            "data": {
                "hearts": hearts,
            },
        }
    )


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})

    if user_item:
        hearts = user_item.get("hearts", 0)
        return hearts
    else :
        logger.error(f"User with email {email} not found")
        return None