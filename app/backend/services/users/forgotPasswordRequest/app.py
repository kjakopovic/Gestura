import json
import boto3
import os
import logging
import random
from datetime import datetime, timedelta, timezone

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE

logger = logging.getLogger("ForgotPasswordRequest")
logger.setLevel(logging.DEBUG)

client = boto3.client('ses', region_name=os.environ.get('SECRETS_REGION_NAME'))


@dataclass
class Request:
    email: str


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

    return send_email(dynamodb, request.email)


def send_email(dynamodb, email):
    source_email = os.environ.get('SOURCE_EMAIL')
    user_exists = check_user_exists(dynamodb, email)

    if not user_exists:
        logger.debug(f"User with email {email} does not exist")
        return build_response(400, {"message": "User does not exist."})

    try:
        random_code = generate_code()
        code_save_success = save_reset_code(dynamodb, email, random_code)

        if code_save_success["ResponseMetadata"]["HTTPStatusCode"] != 200:
            logger.error(f"Error saving reset code: {code_save_success}")
            return build_response(500, {"message": "Error saving reset code."})

        # TODO: Improve the email content
        response = client.send_email(
            Destination={
                'ToAddresses': [email]
            },
            Message={
                'Body': {
                    'Text': {
                        'Charset': 'UTF-8',
                        'Data': f'Your password reset code is: {random_code}. This code will expire in 10 minutes.',
                    }
                },
                'Subject': {
                    'Charset': 'UTF-8',
                    'Data': 'Password Reset Code',
                },
            },
            Source=source_email
        )

        logger.info(f"Email sent to {email}, MessageId: {response['MessageId']}")
        return build_response(
            200,
            {
                "message": "Reset code sent to email",
            },
        )

    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return build_response(500, {"message": "Error sending email."})


def generate_code():
    return str(random.randint(100000, 999999))


def save_reset_code(dynamodb, email, random_code):
    # Calculate expiration time (10 minutes from now)
    expiration_time = int((datetime.now(timezone.utc) + timedelta(minutes=10)).timestamp())

    try:
        response = dynamodb.table.update_item(
            Key={'email': email},
            UpdateExpression='SET reset_code = :code, code_expiration_time = :code_exp_time',
            ExpressionAttributeValues={':code': random_code, ':code_exp_time': expiration_time},
            ReturnValues='UPDATED_NEW'
        )
        logger.info(f"Reset code saved for {email}")
        return response

    except Exception as e:
        logger.error("Error saving reset code: %s", e)
        raise

def check_user_exists(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    response = dynamodb.table.get_item(Key={"email": email})

    user = response.get("Item")
    if not user:
        logger.debug(f"User with email {email} does not exist")
        return False
    return True