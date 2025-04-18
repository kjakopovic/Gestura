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

    jwt_token = event.get("headers").get("x-access-token")
    print(f"JWT token: {jwt_token}")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

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

    return update_user(dynamodb, email, request.settings)


def update_user(dynamodb, email, settings):
    logger.info(f"Updating user {email} with settings {settings}")

    user = get_user_by_email(dynamodb, email)

    if not user:
        logger.debug(f"User with email {email} does not exist")
        return build_response(400, {"message": "User does not exist"})

    if settings["profile"].get("email"):
        new_email = settings["profile"].get("email")
        if new_email:
            existing_user = get_user_by_email(dynamodb, new_email)
            if existing_user and existing_user.get("email") != email:
                logger.debug(f"Email {new_email} is already taken")
                return build_response(400, {"message": "Email is already taken"})

    if settings["profile"].get("username"):
        username = settings["profile"].get("username")
        if username:
            existing_user = get_user_by_username(dynamodb, username)
            if existing_user and existing_user.get("email") != email:
                logger.debug(f"Username {username} is already taken")
                return build_response(400, {"message": "Username is already taken"})

    # Create update expression
    update_expression = "SET "
    expression_attribute_values = {}
    expression_attribute_names = {}

    counter = 0
    for section, properties in settings.items():
        if isinstance(properties, dict):
            for prop, value in properties.items():
                counter += 1
                name_placeholder = f"#n{counter}"
                section_placeholder = f"#s{counter}"
                value_placeholder = f":v{counter}"

                expression_attribute_names[section_placeholder] = section
                expression_attribute_names[name_placeholder] = prop
                expression_attribute_values[value_placeholder] = value

                update_expression += f"{section_placeholder}.{name_placeholder} = {value_placeholder}, "

    # Remove trailing comma and space
    if update_expression.endswith(", "):
        update_expression = update_expression[:-2]

    # Execute update if there are changes
    if counter > 0:
        logger.info(f"Updating user with expression: {update_expression}")
        dynamodb.table.update_item(
            Key={"email": email},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
        )

    return build_response(200, {"message": "User updated successfully"})


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