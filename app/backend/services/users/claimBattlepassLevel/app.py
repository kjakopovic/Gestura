import logging

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response, convert_decimal_to_float
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE, _LAMBDA_BATTLEPASS_TABLE_RESOURCE
from middleware import middleware
from auth import get_email_from_jwt_token
from boto3.dynamodb.conditions import Attr
from datetime import datetime, timezone
from decimal import Decimal

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

    global _LAMBDA_USERS_TABLE_RESOURCE, _LAMBDA_BATTLEPASS_TABLE_RESOURCE
    user_dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    battlepass_dynamodb = LambdaDynamoDBClass(_LAMBDA_BATTLEPASS_TABLE_RESOURCE)

    claim_level = Decimal(query_params.get("battlepass_level"))

    return claim_battlepass_level(user_dynamodb, battlepass_dynamodb, email, claim_level)


def claim_battlepass_level(user_dynamodb, battlepass_dynamodb, email, claim_level):
    logger.debug(f"Claiming battlepass level {claim_level} for user {email}")

    user = get_user_by_email(user_dynamodb, email)
    if not user:
        logger.error(f"User not found: {email}")
        return build_response(404, {"message": "User not found"})

    user_xp = user.get("xp", 0)

    active_battlepass = get_active_battlepass_seassons(battlepass_dynamodb)
    if not active_battlepass:
        logger.debug(f"No active battlepasses found.")
        return build_response(404, {"message": "No active battlepasses found."})

    battlepass_levels = active_battlepass.get("levels", [])
    battlepass_level = next(
        (level for level in battlepass_levels if level.get("level") == claim_level), None
    )

    if not battlepass_level:
        logger.error(f"Battlepass level not found: {claim_level}")
        return build_response(404, {"message": "Battlepass level not found"})

    required_xp = battlepass_level.get("required_xp", 0)

    if user_xp < required_xp:
        logger.error(f"User does not have enough XP to claim level {claim_level}")
        return build_response(400, {"message": "Not enough XP to claim this level"})

    user_coins = user.get("coins", 0)
    level_coins = battlepass_level.get("coins", 0)

    user_coins += level_coins

    user_dynamodb.table.update_item(
        Key={"email": email},
        UpdateExpression="SET coins = :coins",
        ExpressionAttributeValues={":coins": user_coins},
    )

    logger.info(f"User {email} claimed battlepass level {claim_level} and received {level_coins} coins")
    return build_response(
        200,
        {
            "message": f"Battlepass level {claim_level} claimed successfully",
            "coins": level_coins,
        }
    )


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email: {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    return user.get("Item")


def get_active_battlepass_seassons(dynamodb):
    logger.info(f"Fetching active battlepass seasons")

    current_date = datetime.now(timezone.utc)
    logger.debug(f"Current date: {current_date}")
    current_date_str = current_date.isoformat()

    response = dynamodb.table.scan(
        FilterExpression=Attr("start_date").lte(current_date_str) & Attr("end_date").gte(current_date_str)
    )

    active_battlepasses = response.get("Items", [])
    logger.debug(f"Found {len(active_battlepasses)} active battlepasses")

    return active_battlepasses[0] if active_battlepasses else None