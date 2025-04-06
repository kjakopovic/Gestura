import json
import logging

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response, hash_string
from auth import generate_jwt_token, generate_refresh_token
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE

logger = logging.getLogger("ForgotResetPassword")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    email: str
    password: str


def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    body = event.get("body")
    if body is not None:
        request_body = json.loads(body)
    else:
        request_body = event

    try:
        logger.debug(f"Validating request {request_body}")
        validate(event=request_body, schema=schema)
    except SchemaValidationError as e:
        logger.error(f"Validation failed: {e}")
        return build_response(400, {"message": str(e)})

    logger.info("Parsing request body")
    request = Request(**request_body)

    global _LAMBDA_USERS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

    return reset_password(dynamodb, request.email, request.password)


def reset_password(dynamodb, email, password):
    user = fetch_user(dynamodb, email)

    if not user:
        logger.debug(f"User with email {email} does not exist")
        return build_response(400, {"message": "User does not exist."})

    try:
        hashed_password = hash_string(password)

        dynamodb.table.update_item(
            Key={"email": email},
            UpdateExpression="SET password = :password",
            ExpressionAttributeValues={":password": hashed_password},
        )

        logger.info(f"Password reset successfully for user {email}")
        return build_response(200, {"message": "Password reset successfully."})
    except Exception as e:
        logger.error(f"Error resetting password for user {email}: {e}")
        return build_response(500, {"message": "Internal server error."})


def fetch_user(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    return user.get("Item")