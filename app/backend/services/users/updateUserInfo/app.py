import json
import logging

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE
from middleware import middleware
from boto3.dynamodb.conditions import Key
from auth import get_email_from_jwt_token


logger = logging.getLogger("UpdateUserInfo")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    settings: dict


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    # Check if email is present in the event
    # After that, check if user is present in the database
    # Only after that, validate the request
    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    global _LAMBDA_USERS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    user = get_user_by_email(dynamodb, email)

    if not user:
        logger.debug(f"User with email {email} does not exist")
        return build_response(404, {"message": "User not found."})

    logger.debug(f"User with email {email} exists, proceeding with update")

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

    return update_user(dynamodb, email, request.settings)


def update_user(dynamodb, email, settings):
    logger.info(f"Updating user {email} with settings {settings}")

    user = get_user_by_email(dynamodb, email)

    update_parts = []
    expression_attribute_values = {}
    need_email_update = False
    new_email = None
    username = None

    # Handle username update
    if "profile" in settings and settings["profile"].get("username"):
        username = settings["profile"].get("username")
        if username:
            existing_user = get_user_by_username(dynamodb, username)
            if existing_user and existing_user.get("email") != email:
                logger.debug(f"Username {username} is already taken")
                return build_response(400, {"message": "Username is already taken"})

            # Add username to update expression at root level
            update_parts.append("username = :username")
            expression_attribute_values[":username"] = username

    # Handle email update
    if "profile" in settings and settings["profile"].get("email"):
        new_email = settings["profile"].get("email")
        if new_email:
            if new_email == email:
                logger.debug(f"New email is same as old email {new_email}")
                return build_response(400, {"message": "New email is same as old email"})

            existing_user = get_user_by_email(dynamodb, new_email)
            if existing_user and existing_user.get("email") != email:
                logger.debug(f"Email {new_email} is already taken")
                return build_response(400, {"message": "Email is already taken"})

            need_email_update = True

    if settings:
        # Get current settings or initialize empty dict
        current_settings = user.get("settings", {})

        # Update current settings with new values
        for section, properties in settings.items():
            if isinstance(properties, dict):
                if section not in current_settings:
                    current_settings[section] = {}

                # Remove username from profile if it exists (since we handle it separately)
                if section == "profile" and "username" in properties:
                    # A copy is being made to avoid modifying the original dictionary
                    properties_copy = properties.copy()
                    properties_copy.pop("username")
                    current_settings[section].update(properties_copy)
                else:
                    current_settings[section].update(properties)

        update_parts.append("settings = :settings")
        expression_attribute_values[":settings"] = current_settings

    # Handle update without email change
    if update_parts and not need_email_update:
        update_expression = "SET " + ", ".join(update_parts)
        logger.debug(f"Updating user {email} with settings {expression_attribute_values}")

        dynamodb.table.update_item(
            Key={"email": email},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values
        )

        return build_response(200, {"message": "User updated successfully"})

    # If email needs to be updated, we need to create a new item and delete the old one
    # This is because DynamoDB does not allow updating the primary key
    if need_email_update:
        logger.info(f"Updating email for user {email} to {new_email}")

        new_user = user.copy()
        new_user["email"] = new_email

        # Check if username needs to be updated
        if username:
            new_user["username"] = username
        if "settings" in expression_attribute_values:
            new_user["settings"] = expression_attribute_values[":settings"]

        # Create the new record
        dynamodb.table.put_item(Item=new_user)

        # Delete the old record
        dynamodb.table.delete_item(Key={"email": email})

        logger.info(f"Email updated successfully from {email} to {new_email}")
        return build_response(200, {"message": "User updated successfully", "new_email": new_email})

    # If no updates were made
    return build_response(200, {"message": "No changes were made"})


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    return user.get("Item")


def get_user_by_username(dynamodb, username):
    logger.info(f"Getting user by username: {username}")
    response = dynamodb.table.query(
        IndexName="username-index", KeyConditionExpression=Key("username").eq(username)
    )
    items = response.get("Items", [])
    return items[0] if items else None