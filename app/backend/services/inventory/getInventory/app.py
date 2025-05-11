import logging
import json

from common import build_response, convert_decimal_to_float
from middleware import middleware
from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_USERS_TABLE_RESOURCE,
    _LAMBDA_ITEMS_TABLE_RESOURCE,
    _LAMBDA_BATTLEPASS_TABLE_RESOURCE,
)
from auth import get_email_from_jwt_token
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Attr


logger = logging.getLogger("GetInventory")
logger.setLevel(logging.DEBUG)


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    # Extract and validate JWT token from headers
    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    # Initialize DynamoDB resources for required tables
    global _LAMBDA_USERS_TABLE_RESOURCE, _LAMBDA_ITEMS_TABLE_RESOURCE, _LAMBDA_BATTLEPASS_TABLE_RESOURCE
    users_dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    items_dynamodb = LambdaDynamoDBClass(_LAMBDA_ITEMS_TABLE_RESOURCE)
    battlepass_dynamodb = LambdaDynamoDBClass(_LAMBDA_BATTLEPASS_TABLE_RESOURCE)

    # Retrieve user's inventory and battlepass data from users table
    user_items_inventory, user_battlepass = get_user_by_email(users_dynamodb, email)

    response_body = {
        "message": "User inventory fetched successfully",
    }

    if user_items_inventory is False or user_battlepass is False:
        logger.debug(f"User with email {email} not found.")
        return build_response(404, {"message": "User not found."})

    # Fetch detailed information for each item in the user's inventory
    full_items_info = []
    for item_id in user_items_inventory:
        item_info = items_dynamodb.table.get_item(Key={"id": item_id})
        item_info = item_info.get("Item", {})
        if not item_info:
            logger.error(f"Item with ID {item_id} not found.")
            continue

        full_items_info.append(item_info)

    # Add item details to response
    response_body["items"] = full_items_info
    new_battlepass = None

    # Get current active battlepass season
    active_battlepass = get_active_battlepass_seasons(battlepass_dynamodb)
    if not active_battlepass:
        logger.info(f"No active battlepass seasons found {active_battlepass}")
        response_body["active_battlepass"] = []
        return build_response(200, convert_decimal_to_float(response_body))

    # Get current season ID
    season_id = active_battlepass.get("season")

    # Find user's data for the current battlepass season
    current_bp = next(
        (bp for bp in user_battlepass or [] if bp.get("season_id") == season_id),
        None,
    )

    # Create new battlepass entry if user doesn't have one for the current season
    if not current_bp:
        logger.info(
            f"User battlepass not found for season ID: {season_id}."
            f" Adding new battlepass season to user."
        )

        new_battlepass = {
            "season_id": season_id,
            "xp": 0,
            "claimed_levels": [],
        }

        # Add new battlepass data to user's battlepass list
        # And update the user's battlepass in the database
        user_battlepass = user_battlepass or []
        user_battlepass.append(new_battlepass)
        users_dynamodb.table.update_item(
            Key={"email": email},
            UpdateExpression="SET battlepass = :battlepass",
            ExpressionAttributeValues={":battlepass": user_battlepass},
        )

        logger.info(f"New battlepass season added to user: {new_battlepass}")

        # Update current battlepass reference for response
        current_bp = new_battlepass
        response_body["user_battlepass"] = new_battlepass
    else:
        logger.info(f"User already has battlepass for season ID: {season_id}")
        response_body["user_battlepass"] = current_bp

    # Calculate unlocked levels based on user's XP and already claimed levels
    response_body["user_battlepass"]["unlocked_levels"] = get_unlocked_levels(
        active_battlepass.get("levels", []),
        current_bp.get("xp", 0),
        current_bp.get("claimed_levels", []),
    )
    response_body["active_battlepass"] = active_battlepass or []

    # Return successful response with all inventory data
    return build_response(200, convert_decimal_to_float(response_body))


def get_user_by_email(dynamodb, email):
    """
    Retrieve user data from DynamoDB by email address.

    Parameters:
        dynamodb (LambdaDynamoDBClass): DynamoDB client for users table
        email (str): User's email to look up

    Returns:
        tuple: (items_inventory, battlepass) or (False, False) if user not found
    """
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    # Check if user exists
    user_item = user.get("Item", {})
    if not user_item:
        logger.error(f"User with email {email} not found.")
        return False, False

    # Extract inventory and battlepass data
    items_inventory = user_item.get("items_inventory", [])
    user_battlepass = user_item.get("battlepass", None)

    return items_inventory, user_battlepass


def get_active_battlepass_seasons(dynamodb):
    """
    Retrieve currently active battlepass season.
    Finds battlepass with start_date before current time and end_date after current time.

    Parameters:
        dynamodb (LambdaDynamoDBClass): DynamoDB client for battlepass table

    Returns:
        dict: Active battlepass data or None if no active battlepass found
    """
    logger.info(f"Fetching active battlepass seasons")

    # Get current date/time in UTC to compare with battlepass start/end dates
    current_date = datetime.now(timezone.utc)
    logger.debug(f"Current date: {current_date}")
    current_date_str = current_date.isoformat()

    # Query DynamoDB for active battlepass seasons
    # (where current date is between start_date and end_date)
    response = dynamodb.table.scan(
        FilterExpression=Attr("start_date").lte(current_date_str)
        & Attr("end_date").gte(current_date_str)
    )

    active_battlepasses = response.get("Items", [])

    # Handle result based on whether active battlepasses were found
    if not active_battlepasses:
        logger.info(f"No active battlepasses found.")
        return None
    else:
        logger.info(f"Active battlepasses found: {len(active_battlepasses)}")
        logger.debug(
            f"Active battlepass season found: {active_battlepasses[0].get('season_id')}"
        )

        return active_battlepasses[0]


def get_unlocked_levels(
    active_battlepass_levels, user_battlepass_xp, already_claimed_levels=[]
):
    """
    Calculate which battlepass levels a user has unlocked but not yet claimed.

    Parameters:
        active_battlepass_levels: sorted or unsorted list of dicts with keys
            { "required_xp": X, "level": N, ... }
        user_battlepass_xp: the user's total XP
        already_claimed_levels: list of level numbers the user has claimed

    Returns:
        list: Level numbers that are unlocked but not yet claimed
    """
    # Convert XP to float for numeric calculations
    user_battlepass_xp_float = convert_decimal_to_float(user_battlepass_xp)

    # Sort levels by their numeric level value
    sorted_levels = sorted(active_battlepass_levels, key=lambda lvl: lvl["level"])

    unlocked = []
    running_xp = 0.0

    # Iterate through each level to check if it's unlocked
    for lvl in sorted_levels:
        # Get XP required for this level and add to running total
        xp_needed = convert_decimal_to_float(lvl.get("required_xp", 0))
        running_xp += xp_needed

        # Stop once user doesn't have enough XP for this level
        if running_xp > user_battlepass_xp_float:
            break

        level_num = convert_decimal_to_float(lvl.get("level", 0))

        # Add level to unlocked list if not already claimed
        if level_num not in already_claimed_levels:
            unlocked.append(level_num)

    return unlocked
