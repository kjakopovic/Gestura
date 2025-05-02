import logging
import os

from common import build_response
from boto import LambdaDynamoDBClass, _LAMBDA_BATTLEPASS_TABLE_RESOURCE
from middleware import middleware
from auth import get_email_from_jwt_token

logger = logging.getLogger("GetBattlepassLevels")
logger.setLevel(logging.DEBUG)

LATEST_BATTLEPASS_SEASON = int(os.environ.get("LATEST_BATTLEPASS_SEASON", 1))


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    global _LAMBDA_BATTLEPASS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_BATTLEPASS_TABLE_RESOURCE)

    logger.info(f"Getting battlepass levels for season: {LATEST_BATTLEPASS_SEASON}")

    battlepass_item = dynamodb.table.get_item(
        Key={"season": LATEST_BATTLEPASS_SEASON},
    )

    battlepass = battlepass_item.get("Item", {})
    if not battlepass:
        logger.debug(f"No battlepass levels found for season {LATEST_BATTLEPASS_SEASON}.")
        return build_response(404, {"message": "No battlepass levels found."})

    return build_response(
        200,
        {
            "message": "Battlepass levels fetched successfully",
            "battlepass": battlepass_levels,
        },
    )
