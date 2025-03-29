import json
import logging

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response, verify_hash_string
from auth import generate_jwt_token, generate_refresh_token
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE

logger = logging.getLogger("LoginUser")
logger.setLevel(logging.DEBUG)

@dataclass
class Request:
  email: str
  password: str

def lambda_handler(event, context):
  logger.debug(f"Received event {event}")
  request_body = json.loads(event.get('body')) if 'body' in event else event

  try:
    logger.debug(f"Validating request {request_body}")
    validate(event=request_body, schema=schema)
  except SchemaValidationError as e:
    logger.error(f"Validation failed: {e}")
    return build_response(400, {'message': str(e)})
  
  logger.info("Parsing request body")
  request = Request(**request_body)

  global _LAMBDA_USERS_TABLE_RESOURCE
  dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

  return login_user(dynamodb, request.email, request.password)

def login_user(dynamodb, email, password):
  user = get_user_by_email(dynamodb, email)

  if not user or not verify_hash_string(password, user.get("password", "")):
    logger.debug(f"User with email {email} does not exist or password is incorrect")
    return build_response(
      400,
      {
        'message': 'Wrong email or password'
      }
    )

  access_token = generate_jwt_token(email)
  refresh_token = generate_refresh_token(email)

  if not access_token or not refresh_token:
    logger.error(f"Unable to generate tokens for user {email}")
    return build_response(
      500,
      {
        'message': "Unable to generate tokens"
      }
    )

  return build_response(
    200,
    {
      'message': 'User logged in successfully',
      'access_token': access_token,
      'refresh_token': refresh_token
    }
  )

def get_user_by_email(dynamodb, email):
  logger.info(f'Getting user by email {email}')
  user = dynamodb.table.get_item(
    Key={
      'email': email
    }
  )

  return user.get('Item')