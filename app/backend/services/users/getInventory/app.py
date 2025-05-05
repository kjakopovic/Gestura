import logging
import json

from common import build_response, convert_decimal_to_float
from middleware import middleware
from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_USERS_TABLE_RESOURCE,
    _LAMBDA_ITEMS_TABLE_RESOURCE,
    _LAMBDA_BATTLEPASS_TABLE_RESOURCE
)
from auth import get_email_from_jwt_token
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Attr


logger = logging.getLogger("GetInventory")
logger.setLevel(logging.DEBUG)


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    global _LAMBDA_USERS_TABLE_RESOURCE, _LAMBDA_ITEMS_TABLE_RESOURCE, _LAMBDA_BATTLEPASS_TABLE_RESOURCE
    users_dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    items_dynamodb = LambdaDynamoDBClass(_LAMBDA_ITEMS_TABLE_RESOURCE)
    battlepass_dynamodb = LambdaDynamoDBClass(_LAMBDA_BATTLEPASS_TABLE_RESOURCE)

    user_items_inventory, user_battlepass = get_user_by_email(users_dynamodb, email)

    response_body = {
        "message": "User inventory fetched successfully",
    }

    if user_items_inventory is False or user_battlepass is False:
        logger.debug(f"User with email {email} not found.")
        return build_response(404, {"message": "User not found."})

    full_items_info = []
    for item in user_items_inventory:
        item_id = item.get("item_id")
        if not item_id:
            logger.error(f"Item ID not found in user items inventory.")
            continue

        item_info = items_dynamodb.table.get_item(Key={"id": item_id})
        item_info = item_info.get("Item", {})
        if not item_info:
            logger.error(f"Item with ID {item_id} not found.")
            continue

        full_items_info.append(item_info)

    response_body["items"] = full_items_info
    new_battlepass = None

    active_battlepass = get_active_battlepass_seasons(battlepass_dynamodb)
    if active_battlepass:
        season_id = active_battlepass.get("season")

        current_bp = next((bp for bp in user_battlepass or [] if bp.get("season") == season_id), None)

        if not current_bp:
            logger.info(f"User battlepass not found for season ID: {season_id}."
                        f" Adding new battlepass season to user.")

            new_battlepass = {
                "season_id": season_id,
                "xp": 0,
                "claimed_levels": [],
            }

            user_battlepass = user_battlepass or []

            user_battlepass.append(new_battlepass)

            users_dynamodb.table.update_item(
                Key={"email": email},
                UpdateExpression="SET battlepass = :battlepass",
                ExpressionAttributeValues={
                    ":battlepass": user_battlepass
                }
            )

            logger.info(f"New battlepass season added to user: {new_battlepass}")

            response_body["user_battlepass"] = new_battlepass
        else:
            logger.info(f"User already has battlepass for season ID: {season_id}")
            response_body["user_battlepass"] = current_bp

    response_body["active_battlepass"] = active_battlepass or "No active battlepass found."

    return build_response(
        200,
        convert_decimal_to_float(response_body)
    )


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})
    if not user_item:
        logger.error(f"User with email {email} not found.")
        return False, False

    items_inventory = user_item.get("items_inventory", [])
    user_battlepass = user_item.get("battlepass", None)

    return items_inventory, user_battlepass


def get_active_battlepass_seasons(dynamodb):
    logger.info(f"Fetching active battlepass seasons")

    current_date = datetime.now(timezone.utc)
    logger.debug(f"Current date: {current_date}")
    current_date_str = current_date.isoformat()

    response = dynamodb.table.scan(
        FilterExpression=Attr("start_date").lte(current_date_str) & Attr("end_date").gte(current_date_str)
    )

    active_battlepasses = response.get("Items", [])

    if not active_battlepasses:
        logger.info(f"No active battlepasses found.")
        return None
    else:
        logger.info(f"Active battlepasses found: {len(active_battlepasses)}")
        logger.debug(f"Active battlepass season found: {active_battlepasses[0].get('season_id')}")

        return active_battlepasses[0]