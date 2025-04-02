import json
import logging

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response, hash_string
from auth import generate_jwt_token, generate_refresh_token
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE
import boto3

logger = logging.getLogger("SignUpUser")
logger.setLevel(logging.DEBUG)

@dataclass
class Request:
    email: str
    username: str
    password: str

def lambda_handler(event, context):
    logger.debug(f"Received event: {event}")
    request_body = json.loads(event.get('body')) if 'body' in event else event

    try:
        logger.debug(f"Validating request: {request_body}")
        validate(event=request_body, schema=schema)
    except SchemaValidationError as e:
        logger.error(f"Validation failed: {e}")
        return build_response(400, {'message': str(e)})

    logger.info("Parsing request body")
    request = Request(**request_body)

    global _LAMBDA_USERS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

    return sign_up_user(dynamodb, request.email, request.username,request.password)

def sign_up_user(dynamodb, email, username, password):
    existing_email_user = get_user_by_email(dynamodb, email)
    existing_username_user = get_user_by_username(dynamodb, username)

    if existing_email_user:
        logger.debug(f"User with email {email} already exists")
        return build_response(
            400,
            {
                'message': 'Email already in use.'
            }
        )
    if existing_username_user:
        logger.debug(f"User with username {username} already exists")
        return build_response(
            400,
            {
                'message': 'Username already in use.'
            }
        )

    hashed_password = hash_string(password)

    add_user_to_the_table(dynamodb, {
        'email': email,
        'username': username,
        'password': hashed_password
    })

    refresh_token = generate_refresh_token(email)
    access_token = generate_jwt_token(email)

    logger.info(f"User {username} created")
    return build_response(
        200,
        {
            'message': 'User created successfully',
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    )


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email: {email}")
    user = dynamodb.table.get_item(
        Key={
            'email': email
        }
    )

    return user.get('Item')

def get_user_by_username(dynamodb, username):
    logger.info(f"Getting user by username: {username}")
    response = dynamodb.table.query(
        IndexName='username-index',
        KeyConditionExpression=boto3.dynamodb.conditions.Key('username').eq(username)
    )
    items = response.get('Items', [])
    return items[0] if items else None

def add_user_to_the_table(dynamodb, user):
    logger.info(f"Adding user with email: {user['email']} to the table")
    dynamodb.table.put_item(Item=user)
