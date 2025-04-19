import json
import logging

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response
from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_USERS_TABLE_RESOURCE,
    _LAMBDA_LANGUAGES_TABLE_RESOURCE,
)
from middleware import middleware
from boto3.dynamodb.conditions import Key
from auth import get_email_from_jwt_token
from typing import Optional


logger = logging.getLogger("UpdateUserInfo")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    sound_effects: Optional[bool] = None
    haptic_feedback: Optional[bool] = None
    push_notifications: Optional[bool] = None
    heart_refill: Optional[bool] = None
    daily_reminder: Optional[bool] = None
    subscription: Optional[bool] = None
    chosen_language: Optional[str] = None
    username: Optional[str] = None
    phone_number: Optional[str] = None


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(401, {"message": "Invalid email in jwt token"})

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
    global _LAMBDA_LANGUAGES_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    languagesTable = LambdaDynamoDBClass(_LAMBDA_LANGUAGES_TABLE_RESOURCE)

    user = get_user_by_email(dynamodb, email)
    if not user:
        logger.debug(f"User with email {email} does not exist")
        return build_response(404, {"message": "User not found."})

    language = get_language_by_id(languagesTable, request.chosen_language)
    if not language:
        logger.error(f"Language with id {request.chosen_language} not found")
        return build_response(404, {"message": "Language not found"})

    logger.debug(f"User with email {email} exists, proceeding with update")

    return update_user(dynamodb, email, request)


def update_user(dynamodb, email, request):
    logger.info(f"Updating user {email} with settings {request}")

    update_parts = []
    expression_attribute_values = {}

    if request.sound_effects is not None:
        update_parts.append("sound_effects = :sound_effects")
        expression_attribute_values[":sound_effects"] = request.sound_effects

    if request.haptic_feedback is not None:
        update_parts.append("haptic_feedback = :haptic_feedback")
        expression_attribute_values[":haptic_feedback"] = request.haptic_feedback

    if request.push_notifications is not None:
        update_parts.append("push_notifications = :push_notifications")
        expression_attribute_values[":push_notifications"] = request.push_notifications

    if request.heart_refill is not None:
        update_parts.append("heart_refill = :heart_refill")
        expression_attribute_values[":heart_refill"] = request.heart_refill

    if request.daily_reminder is not None:
        update_parts.append("daily_reminder = :daily_reminder")
        expression_attribute_values[":daily_reminder"] = request.daily_reminder

    if request.subscription is not None:
        update_parts.append("subscription = :subscription")
        expression_attribute_values[":subscription"] = request.subscription

    if request.username is not None:
        update_parts.append("username = :username")
        expression_attribute_values[":username"] = request.username

    if request.phone_number is not None:
        update_parts.append("phone_number = :phone_number")
        expression_attribute_values[":phone_number"] = request.phone_number

    if request.chosen_language is not None:
        update_parts.append("language_id = :language_id")
        expression_attribute_values[":language_id"] = request.chosen_language

    if update_parts:
        update_expression = "SET " + ", ".join(update_parts)
        logger.debug(
            f"Updating user {email} with settings {expression_attribute_values}"
        )

        dynamodb.table.update_item(
            Key={"email": email},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
        )

        return build_response(200, {"message": "User updated successfully"})

    # If no update parts were provided
    return build_response(200, {"message": "No changes were made"})


def get_language_by_id(dynamodb, id: str):
    logger.info(f"Getting language by id {id}")
    language = dynamodb.table.get_item(Key={"id": id})

    language_item = language.get("Item", {})

    return language_item


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
