import logging

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import validate
from common import build_response, ValidationError
from middleware import middleware
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE

logger = logging.getLogger("GetUserInfo")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    email: str


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    path_params = event.get("pathParameters", {})
    try:
        logger.debug(f"Validating path params: {path_params}")

        validate(event=path_params, schema=schema)
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")

        raise ValidationError(str(e))

    global _LAMBDA_USERS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

    email = path_params.get("email")
    user = get_user_by_email(dynamodb, email)

    if not user:
        logger.debug(f"User with email {email} not found.")
        return build_response(
            404,
            {
                "message": "User not found."
            }
        )

    return build_response(
        200,
        {
            "message": "User info fetched successfully",
            "info": user
        }
    )


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})
    if user_item:
        del user_item["password"]

    return user_item