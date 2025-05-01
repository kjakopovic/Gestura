import logging

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response, convert_decimal_to_float
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE
from middleware import middleware
from auth import get_email_from_jwt_token

logger = logging.getLogger("ClaimBattlepassLevel")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    battlepass_level: str


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    query_params = event.get("queryStringParameters", {})
    try:
        logger.debug(f"Validating query params: {query_params}")

        validate(event=query_params, schema=schema)
    except SchemaValidationError as e:
        logger.error(f"Validation failed: {e}")
        return build_response(400, {"message": str(e)})

    global _LAMBDA_USERS_TABLE_RESOURCE
    user_dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

    user = get_user_by_email(user_dynamodb, email)
    if user is None:
        logger.error(f"User {email} not found in the database.")
        return build_response(404, {"message": "User not found"})

    battlepass_level = int(query_params.get("battlepass_level", 1))

    required_sum = 0
    for i in range(0, battlepass_level + 1):
        required_sum += i

    users_battlepass_xp = user.get("battlepass_xp", 0)

    if users_battlepass_xp + battlepass_level == required_sum:
        logger.info(f"Battlepass level {battlepass_level} is valid.")

        coins = user.get("coins", 0)
        coins += battlepass_level * 25
        logger.info(f"Giving {battlepass_level * 25} coins to user {email}.")

        update_parts = []
        expression_attribute_values = {}

        update_parts.append("coins = :coins")
        expression_attribute_values[":coins"] = coins
        update_parts.append("battlepass_xp = :xp")
        expression_attribute_values[":xp"] = users_battlepass_xp + battlepass_level

        update_expression = "SET " + ", ".join(update_parts)

        user_dynamodb.table.update_item(
            Key={"email": email},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
        )

        logger.info(f"User {email} battlepass_xp updated to {users_battlepass_xp + battlepass_level}.")
        return build_response(200, {"message": "Battlepass level claimed successfully."})
    elif users_battlepass_xp + battlepass_level >= required_sum:
        logger.info(f"Battlepass level {battlepass_level} has already been claimed.")
        return build_response(
            400,
            {
                "message": f"Battlepass level {battlepass_level} has already been claimed."
            },
        )

    return build_response(
        400,
        {
            "message": f"Not able to claim battlepass level {battlepass_level}, not enough xp."
        },
    )


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email: {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    return user.get("Item")