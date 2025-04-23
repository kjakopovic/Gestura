import json
import logging

from common import build_response
from auth import generate_jwt_token, get_expiration_time, get_email_from_refresh_token
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE, get_secrets_from_aws_secrets_manager
from middleware import validate_refresh_token
from os import environ


logger = logging.getLogger("RefreshToken")
logger.setLevel(logging.DEBUG)


def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    jwt_token = event.get("headers").get("x-refresh-token")
    email = get_email_from_refresh_token(jwt_token)
    print(f"Email from JWT token: {email}")

    global _LAMBDA_USERS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

    user_email = get_user_by_email(dynamodb, email)

    if not user_email:
        logger.debug(f"User with email {email} not found")
        return build_response(
            401,
            {"message": "User not found in database"},
        )

    secrets = get_secrets_from_aws_secrets_manager(
        environ.get("JWT_SECRET_NAME"), environ.get("SECRETS_REGION_NAME")
    )

    response = validate_refresh_token(jwt_token, secrets["refresh_secret"], secrets["jwt_secret"])

    return response


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})

    if user_item:
        user_email = user_item.get("email", None)
        return user_email
    else:
        logger.error(f"User with email {email} not found")
        return None