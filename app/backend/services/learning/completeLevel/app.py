import logging
import json
import random

from datetime import datetime, timezone
from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import validate, SchemaValidationError
from common import build_response, parse_utc_isoformat, convert_decimal_to_float
from auth import get_email_from_jwt_token
from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_LANGUAGES_TABLE_RESOURCE,
    _LAMBDA_USERS_TABLE_RESOURCE,
    _LAMBDA_BATTLEPASS_TABLE_RESOURCE,
    _LAMBDA_ACHIEVEMENTS_TABLE_RESOURCE,
)
from middleware import middleware
from typing import List
from decimal import Decimal
from boto3.dynamodb.conditions import Attr

logger = logging.getLogger("CompleteLevel")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    correct_answers_versions: List[int]
    started_at: str
    finished_at: str
    language_id: str
    letters_learned: List[str]


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event: {event}")

    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    body = event.get("body")
    if body is not None:
        request_body = json.loads(body)
    else:
        request_body = event

    try:
        logger.debug(f"Validating request: {request_body}")
        validate(event=request_body, schema=schema)
    except SchemaValidationError as e:
        logger.error(f"Validation failed: {e}")
        return build_response(400, {"message": str(e)})

    logger.info("Parsing request body")
    request = Request(**request_body)

    global _LAMBDA_LANGUAGES_TABLE_RESOURCE
    global _LAMBDA_USERS_TABLE_RESOURCE
    global _LAMBDA_BATTLEPASS_TABLE_RESOURCE
    global _LAMBDA_ACHIEVEMENTS_TABLE_RESOURCE

    languagesTable = LambdaDynamoDBClass(_LAMBDA_LANGUAGES_TABLE_RESOURCE)
    usersTable = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    battlepassTable = LambdaDynamoDBClass(_LAMBDA_BATTLEPASS_TABLE_RESOURCE)
    achievementsTable = LambdaDynamoDBClass(_LAMBDA_ACHIEVEMENTS_TABLE_RESOURCE)

    user = get_user_by_email(usersTable, email)
    if not user:
        logger.error(f"User with email {email} not found")
        return build_response(404, {"message": "User not found"})

    language = get_language_by_id(languagesTable, request.language_id)
    if not language:
        logger.error(f"Language with id {request.language_id} not found")
        return build_response(404, {"message": "Language not found"})

    logger.info("Calculating time played")
    time_played = Decimal(str(seconds_between(request.started_at, request.finished_at)))

    logger.info(f"Updating users letters learned {user['letters_learned']}")
    letters_learned = update_letters_learned(
        user["letters_learned"], request.language_id, request.letters_learned
    )

    active_items, item_removed = check_active_items(user, usersTable)

    xp, coins = calculate_xp_and_coins(request.correct_answers_versions)
    xp = Decimal(str(xp))
    coins = Decimal(str(coins))

    multiplier = get_xp_multiplier(active_items)
    xp *= multiplier

    # --- Updating user level for this language ---
    user_levels = user.get("current_level", {})
    current_lang_level = user_levels.get(request.language_id, 1) + 1
    user_levels[request.language_id] = current_lang_level

    user_bp = update_users_battlepass_xp(user, xp, battlepassTable)

    logger.info(
        f"Updating user {email} with time played: {time_played}, task level: {user_levels[request.language_id]}, letters learned: {letters_learned}"
    )

    if not item_removed:
        active_items = None

    update_user(
        usersTable,
        email,
        user_levels,
        user.get("time_played", 0) + time_played,
        letters_learned,
        user.get("xp", 0) + xp,
        user_bp,
        user.get("coins", 0) + coins,
        active_items
    )

    new_achievements = update_user_achievements(
        usersTable,
        achievementsTable,
        email,
        user.get("time_played", 0) + time_played,
        user.get("xp", 0) + xp,
        user_levels,
        user.get("achievements", [])
    )

    response_body = {
        "message": "Level completed successfully",
        "xp": xp,
        "coins": coins,
        "percentage": round(len(request.correct_answers_versions) / 15),
        "new_achievements": [],
    }

    if new_achievements:
        response_body["new_achievements"] = new_achievements

    return build_response(200, convert_decimal_to_float(response_body))


def update_user(
    dynamodb,
    email,
    current_level,
    time_played,
    letters_learned,
    xp,
    battlepass,
    coins,
    activated_items,
):
    logger.info(f"Updating user with email: {email}")

    update_expression = "SET "
    expression_attribute_values = {}

    logger.debug(f"Updating current level to {current_level}")
    update_expression += "current_level = :current_level, "
    expression_attribute_values[":current_level"] = current_level

    logger.debug(f"Updating time played to {time_played}")
    update_expression += "time_played = :time_played, "
    expression_attribute_values[":time_played"] = time_played

    logger.debug(f"Updating letters learned to {letters_learned}")
    update_expression += "letters_learned = :letters_learned, "
    expression_attribute_values[":letters_learned"] = letters_learned

    logger.debug(f"Updating xp to {xp}")
    update_expression += "xp = :xp, "
    expression_attribute_values[":xp"] = xp

    logger.debug(f"Updating battlepass to {battlepass}")
    update_expression += "battlepass = :battlepass, "
    expression_attribute_values[":battlepass"] = battlepass

    logger.debug(f"Updating coins to {coins}")
    update_expression += "coins = :coins, "
    expression_attribute_values[":coins"] = coins

    if activated_items is not None:
        logger.debug(f"Updating activated items to {activated_items}")
        update_expression += "activated_items = :activated_items, "
        expression_attribute_values[":activated_items"] = activated_items

    dynamodb.table.update_item(
        Key={"email": email},
        UpdateExpression=update_expression.rstrip(", "),
        ExpressionAttributeValues=expression_attribute_values,
    )


def update_users_battlepass_xp(user, xp, battlepassDb):
    user_bp: dict = user.setdefault("battlepass", {})

    # 1) fetch & validate active season
    active_bp = get_active_battlepass_seasons(battlepassDb)
    if not active_bp:
        logger.error(
            f"No active battlepass for user {user.get("email", "")}; skipping XP bump."
        )
        return None

    season_id = active_bp.get("season")
    if not season_id:
        logger.error(
            f"Active battlepass found but missing season ID; skipping XP bump."
        )
        return None

    # 2) Get or create this season’s entry
    #    Defaults: xp=0, claimed_levels=[]
    season_entry = user_bp.setdefault(season_id, {"xp": 0, "claimed_levels": []})

    # 3) Update the XP counter
    old_xp = season_entry.get("xp", 0)
    season_entry["xp"] = old_xp + xp
    logger.info(f"Battlepass '{season_id}' XP: {old_xp} → {season_entry['xp']}")

    # 4) Update user battlepass for new season entry
    user_bp[season_id] = season_entry

    return user_bp


def get_language_by_id(dynamodb, id):
    logger.info(f"Getting language by id {id}")
    language = dynamodb.table.get_item(Key={"id": id})

    language_item = language.get("Item", {})

    return language_item


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    if not email:
        logger.error("Email is None")
        return None

    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})

    return user_item


def get_active_battlepass_seasons(dynamodb):
    logger.info(f"Fetching active battlepass seasons")

    current_date = datetime.now(timezone.utc)
    logger.debug(f"Current date: {current_date}")
    current_date_str = current_date.isoformat()

    response = dynamodb.table.scan(
        FilterExpression=Attr("start_date").lte(current_date_str)
        & Attr("end_date").gte(current_date_str)
    )

    active_battlepasses = response.get("Items", [])
    logger.debug(f"Found {len(active_battlepasses)} active battlepasses")

    return active_battlepasses[0] if active_battlepasses else None


def seconds_between(started_at: str, finished_at: str) -> float:
    """
    Calculate how many seconds elapsed between two UTC timestamp strings.

    :param started_at: ISO‑8601 UTC string, e.g. '2025-04-18T14:30:00Z'
    :param finished_at: same format
    :return: difference in seconds (finished_at – started_at)
    """
    start_dt = parse_utc_isoformat(started_at)
    end_dt = parse_utc_isoformat(finished_at)

    # Ensure both are timezone‑aware and in UTC
    if start_dt.tzinfo is None:
        start_dt = start_dt.replace(tzinfo=timezone.utc)
    if end_dt.tzinfo is None:
        end_dt = end_dt.replace(tzinfo=timezone.utc)

    delta = end_dt - start_dt
    return delta.total_seconds()


def update_letters_learned(
    current_state: dict, language_id: str, new_letters: list
) -> dict:
    """
    Given:
      - current_state: e.g. {"en": ["A","B","C"], "hr": ["Z"]}
      - language_id: e.g. "en" or "hr" or a new code
      - new_letters: list of letters/words to add

    Returns the updated state (mutating the dict in-place, but also returning it).
    """
    # Ensure there’s a list for this language
    if language_id not in current_state:
        current_state[language_id] = []

    # For each new letter, only append if it isn't already present
    existing = current_state[language_id]
    for letter in new_letters:
        if letter not in existing:
            existing.append(letter)

    return current_state


def calculate_xp_and_coins(correct_answers_versions):
    """
    :param correct_answers_versions: list of ints in [1,2,3]
    :return: tuple (xp, coins), where
             xp    = 2 per 1, 3 per 2, 5 per 3
             coins = floor(xp * random_multiplier) with multiplier in [1.0, 2.0]
    """
    logger.debug(f"Calculating XP and coins for versions: {correct_answers_versions}")

    xp_map = {1: 2, 2: 3, 3: 5}
    logger.debug(f"XP map: {xp_map}")

    logger.info(f"Calculating XP for versions: {correct_answers_versions}")
    xp = sum(xp_map.get(v, 0) for v in correct_answers_versions)
    logger.debug(f"XP calculated: {xp}")

    multiplier = random.uniform(1.0, 2.0)

    logger.info(f"Calculating coins: {xp} * {multiplier}")
    coins = int(xp * multiplier)

    return xp, coins


def check_active_items(user, dynamodb):
    """
    Check if the user has any active items and update the user accordingly.
    """
    active_items = user.get("activated_items", [])
    if not active_items:
        logger.debug(f"User {user['email']} has no active items.")
        return None, False

    logger.info(f"User {user['email']} has active items: {active_items}")
    logger.info(f"Checking if active items are expired.")
    current_time = datetime.now(timezone.utc)

    item_removed = False

    for item in active_items:
        if "expires_at" in item:
            expires_at = parse_utc_isoformat(item["expires_at"])
            if expires_at < current_time:
                logger.info(f"Item {item} has expired.")
                active_items.remove(item)
                item_removed = True

    logger.info(f"User {user['email']} has active items after expiration check: {active_items}")
    return active_items, item_removed


def get_xp_multiplier(active_items):
    """
    Calculate the XP multiplier based on active items.

    Args:
        active_items: List of user's activated items

    Returns:
        Total XP multiplier (default 1.0 if no multipliers found)
    """
    if not active_items:
        return Decimal('1.0')

    multiplier = Decimal('1.0')
    current_time = datetime.now(timezone.utc)

    for item in active_items:
        # Check if item has effects with a multiplier and is an XP boost
        if (item.get("category") == "xp_boost" and
                "effects" in item and
                "multiplier" in item["effects"]):

                multiplier *= item["effects"]["multiplier"]

    logger.info(f"XP multiplier: {multiplier}")
    return multiplier


def update_user_achievements(usersTable, achievementsTable, email, time_played, xp, user_levels, achievements):
    logger.info(f"Checking for new achievements for user {email}")

    user_achievements = achievements
    if not user_achievements:
        user_achievements = []

    # Ensure values are Decimal
    # xp = float(str(xp))
    # time_played = float(str("time_played")) if time_played else Decimal('0')

    # Calculate max level across all languages
    max_level = max(user_levels.values()) if user_levels else 0
    max_level = Decimal(str(max_level))

    new_achievements = []

    # Get achievements for each type, sorted by requires in descending order
    achievement_types = [
        {"type": "time_played", "value": time_played},
        {"type": "xp", "value": xp},
        {"type": "level", "value": max_level}
    ]

    for achievement_type in achievement_types:
        response = achievementsTable.table.scan(
            FilterExpression=Attr("type").eq(achievement_type["type"]) &
                             Attr("requires").lte(achievement_type["value"])
        )

        # Sort achievements by requires in descending order
        achievements = sorted(
            response.get("Items", []),
            key=lambda a: a.get("requires", 0),
            reverse=True
        )

        for achievement in achievements:
            # If we find an achievement the user already has, break the loop
            # (assumes achievements are earned in order)
            if achievement["id"] in user_achievements:
                break

            # Otherwise, add this achievement
            new_achievements.append(achievement["id"])
            user_achievements.append(achievement["id"])

    # Update user if new achievements were earned
    if new_achievements:
        logger.info(f"User {email} earned new achievements: {new_achievements}")
        usersTable.table.update_item(
            Key={"email": email},
            UpdateExpression="SET achievements = :achievements",
            ExpressionAttributeValues={":achievements": user_achievements}
        )

    return new_achievements