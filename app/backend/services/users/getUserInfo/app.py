import logging

from common import build_response
from middleware import middleware
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE
from auth import get_email_from_jwt_token

logger = logging.getLogger("GetUserInfo")
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

    user = get_user_by_email(dynamodb, email)

    if not user:
        logger.debug(f"User with email {email} not found.")
        return build_response(404, {"message": "User not found."})

    return build_response(
        200, {"message": "User info fetched successfully", "data": user}
    )


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})
    if user_item:
        del user_item["password"]

    return user_item
