import json
import logging
from datetime import datetime, timezone

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE

logger = logging.getLogger("ValidateResetCode")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    email: str
    code: str


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

    return validate_reset_code(dynamodb, request.email, request.code)


def validate_reset_code(dynamodb, email, code):
    user = fetch_user(dynamodb, email)

    if not user:
        logger.debug(f"User with email {email} does not exist")
        return build_response(400, {"message": "User does not exist."})

    try:
        logger.info(f"Verifying reset code for user {email}")
        saved_code = user.get("reset_code")
        saved_expiration_time = user.get("code_expiration_time")

        if not saved_code or not saved_expiration_time:
            logger.debug(f"No reset code found for user {email}")
            return build_response(400, {"message": "No reset code found."})

        code_valid = verify_reset_code(email, code, saved_code, saved_expiration_time)
    except Exception as e:
        logger.error(f"Error verifying reset code: {e}")
        return build_response(500, {"message": "Internal server error."})

    if code_valid:
        cleared_code = clear_reset_code(dynamodb, email)
        if not cleared_code:
            logger.error(f"Error clearing reset code for user {email}")
            return build_response(500, {"message": "Error clearing reset code."})

        return build_response(200, {"message": "Reset code is valid."})
    else:
        return build_response(400, {"message": "Invalid reset code."})


def fetch_user(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    return user.get("Item")


def verify_reset_code(email, code, saved_code, expiration_time):
    logger.info(f"Verifying reset code for user {email}")

    if code != saved_code:
        logger.debug(f"Reset code does not match for user {email}")
        return False

    current_time = int(datetime.now(timezone.utc).timestamp())
    if current_time > expiration_time:
        logger.debug(f"Reset code has expired for user {email}")
        return False

    logger.info(f"Reset code matches for user {email}")
    return True


def clear_reset_code(dynamodb, email):
    try:
        dynamodb.table.upate_item(
            Key={'email': email},
            UpdateExpression="REMOVE reset_code, code_expiration_time",
            ReturnValues="UPDATED_NEW"
        )
        logger.info(f"Reset code cleared for user {email}")
        return True
    except Exception as e:
        logger.error(f"Error clearing reset code: {e}")
        return False