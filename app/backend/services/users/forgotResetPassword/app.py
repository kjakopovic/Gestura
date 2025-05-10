import json
import logging
from datetime import datetime, timezone

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response, hash_string
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE

logger = logging.getLogger("forgotResetPassword")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    email: str
    password: str
    code: str


def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    # Extract request body from the event and validate it against validation schema
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

    # Initialize DynamoDB resource
    global _LAMBDA_USERS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

    # Process the password reset verification and update
    return validate_and_reset(dynamodb, request.email, request.password, request.code)


def validate_and_reset(dynamodb, email, password, code):
    """
    Core function to verify the reset code and update the user's password.

    Parameters:
        dynamodb: DynamoDB client for users table
        email: User's email address
        password: New password to set
        code: Verification code to validate

    Returns:
        HTTP response indicating success or failure of the password reset
    """
    user = fetch_user(dynamodb, email)

    if not user:
        logger.debug(f"User with email {email} does not exist")
        return build_response(400, {"message": "User does not exist."})

    try:
        logger.info(f"Verifying reset code for user {email}")
        # Get saved reset code and its expiration time and check if it exists in user record
        saved_code = user.get("reset_code")
        saved_expiration_time = user.get("code_expiration_time")

        if not saved_code or not saved_expiration_time:
            logger.debug(f"No reset code found for user {email}")
            return build_response(400, {"message": "No reset code found."})

        # Verify the reset code and check if it has expired
        code_valid, error_message = verify_reset_code(email, code, saved_code, saved_expiration_time)

        if not code_valid:
            logger.debug(f"Reset code is invalid for user {email}: {error_message}")
            return build_response(400, {"message": error_message})

        # Clear the reset code to prevent reuse
        cleared_code = clear_reset_code(dynamodb, email)

        if not cleared_code:
            logger.error(f"Error clearing reset code for user {email}")
            return build_response(500, {"message": "Error clearing reset code."})

        # Hash the new password and update it in the database
        hashed_password = hash_string(password)
        dynamodb.table.update_item(
            Key={"email": email},
            UpdateExpression="SET password = :password",
            ExpressionAttributeValues={":password": hashed_password},
        )

        logger.info(f"Password reset successfully for user {email}")
        return build_response(200, {"message": "Password reset successfully."})

    except Exception as e:
        logger.error(f"Error verifying reset code: {e}")
        return build_response(500, {"message": "Internal server error."})


def fetch_user(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    return user.get("Item")


def verify_reset_code(email, code, saved_code, expiration_time):
    """
    Verify that the provided reset code matches the stored code
    and hasn't expired.

    Parameters:
        email: User's email (for logging)
        code: Reset code provided by the user
        saved_code: Reset code stored in the database
        expiration_time: Timestamp when the code expires

    Returns:
        tuple: (is_valid, error_message)
          where is_valid is a boolean indicating if the code is valid
          and error_message contains the reason for invalidity (or None if valid)
    """
    logger.info(f"Verifying reset code for user {email}")

    if code != saved_code:
        logger.debug(f"Reset code does not match for user {email}")
        return False, "Invalid reset code"

    current_time = int(datetime.now(timezone.utc).timestamp())
    if current_time > expiration_time:
        logger.debug(f"Reset code has expired for user {email}")
        return False, "Reset code has expired"

    logger.info(f"Reset code matches for user {email}")
    return True, None


def clear_reset_code(dynamodb, email):
    """
    Remove the reset code and expiration time from the user's record
    to prevent the code from being reused.

    Parameters:
        dynamodb: DynamoDB client for users table
        email: User's email address

    Returns:
        Boolean indicating success (True) or failure (False)
    """
    try:
        dynamodb.table.update_item(
            Key={'email': email},
            UpdateExpression="REMOVE reset_code, code_expiration_time",
            ReturnValues="UPDATED_NEW"
        )
        logger.info(f"Reset code cleared for user {email}")
        return True
    except Exception as e:
        logger.error(f"Error clearing reset code: {e}")
        return False