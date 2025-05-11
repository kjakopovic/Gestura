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

    # Extract request body from event and validate it against validation schema
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

    # Parse validated request into data class
    logger.info("Parsing request body")
    request = Request(**request_body)

    # Initialize DynamoDB resources for required tables
    global _LAMBDA_LANGUAGES_TABLE_RESOURCE
    global _LAMBDA_USERS_TABLE_RESOURCE
    global _LAMBDA_BATTLEPASS_TABLE_RESOURCE
    global _LAMBDA_ACHIEVEMENTS_TABLE_RESOURCE

    languagesTable = LambdaDynamoDBClass(_LAMBDA_LANGUAGES_TABLE_RESOURCE)
    usersTable = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    battlepassTable = LambdaDynamoDBClass(_LAMBDA_BATTLEPASS_TABLE_RESOURCE)
    achievementsTable = LambdaDynamoDBClass(_LAMBDA_ACHIEVEMENTS_TABLE_RESOURCE)

    # Retrieve user and language data from DynamoDB and check if they exist
    user = get_user_by_email(usersTable, email)
    if not user:
        logger.error(f"User with email {email} not found")
        return build_response(404, {"message": "User not found"})

    language = get_language_by_id(languagesTable, request.language_id)
    if not language:
        logger.error(f"Language with id {request.language_id} not found")
        return build_response(404, {"message": "Language not found"})

    # Calculate time spent on this learning session
    logger.info("Calculating time played")
    time_played = Decimal(str(seconds_between(request.started_at, request.finished_at)))

    # Update user's list of learned letters/words for this language
    logger.info(f"Updating users letters learned {user['letters_learned']}")
    letters_learned = update_letters_learned(
        user["letters_learned"], request.language_id, request.letters_learned
    )

    # Check for active items (e.g., XP boosters) and remove expired ones
    # active_items contains the list of active items ids, item_removed indicates if any item was removed
    active_items, item_removed = check_active_items(user, usersTable)

    # Calculate base XP and coins earned from this session and apply multipliers
    xp, coins = calculate_xp_and_coins(request.correct_answers_versions)
    xp = Decimal(str(xp))
    coins = Decimal(str(coins))

    multiplier = get_xp_multiplier(active_items)
    xp *= multiplier

    # Update user's level for this specific language
    user_levels = user.get("current_level", {})
    current_lang_level = user_levels.get(request.language_id, 1) + 1
    user_levels[request.language_id] = current_lang_level

    # Update user's battlepass XP with newly earned XP
    user_bp = update_users_battlepass_xp(user, xp, battlepassTable)

    logger.info(
        f"Updating user {email} with time played: {time_played}, task level: {user_levels[request.language_id]}, letters learned: {letters_learned}"
    )

    # Only update active_items in DB if something was removed
    if not item_removed:
        active_items = None

    # Update user record with all progress changes
    update_user(
        usersTable,
        email,
        user_levels,
        user.get("time_played", 0) + time_played,
        letters_learned,
        user.get("xp", 0) + xp,
        user_bp,
        user.get("coins", 0) + coins,
        active_items,
    )

    # Check for and award any newly earned achievements
    new_achievements = update_user_achievements(
        usersTable,
        achievementsTable,
        email,
        user.get("time_played", 0) + time_played,
        user.get("xp", 0) + xp,
        letters_learned,
        user.get("achievements", []),
    )

    # Prepare success response with rewards and achievement info
    response_body = {
        "message": "Level completed successfully",
        "xp": xp,
        "coins": coins,
        "percentage": round(len(request.correct_answers_versions) / 15),
        "new_achievements": [],
    }

    if new_achievements:
        response_body["new_achievements"] = new_achievements

    # Return final response with all rewards and progress
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
    """
        Update multiple user attributes in DynamoDB in a single atomic operation.

        Parameters:
            dynamodb: DynamoDB table resource
            email: User's email (primary key)
            current_level: Dictionary of language levels
            time_played: Total time played in seconds
            letters_learned: Dictionary of learned letters by language
            xp: Total experience points
            battlepass: User's battlepass data
            coins: User's coin balance
            activated_items: List of active items (or None if no changes)
        """
    logger.info(f"Updating user with email: {email}")

    # Build the update expression and attribute values dynamically
    update_expression = "SET "
    expression_attribute_values = {}

    # Add each attribute to the update expression
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

    # Only update activated items if there was a change
    if activated_items is not None:
        logger.debug(f"Updating activated items to {activated_items}")
        update_expression += "activated_items = :activated_items, "
        expression_attribute_values[":activated_items"] = activated_items

    # Execute DynamoDB update operation
    dynamodb.table.update_item(
        Key={"email": email},
        UpdateExpression=update_expression.rstrip(", "),
        ExpressionAttributeValues=expression_attribute_values,
    )


def update_users_battlepass_xp(user, xp, battlepassDb):
    """
    Update the user's battlepass XP for the current active season.
    If user doesn't have an entry for the current season, creates one.

    Parameters:
        user: User document from DynamoDB
        xp: Experience points to add
        battlepassDb: DynamoDB table resource for battlepass data

    Returns:
        Updated battlepass list or None if no active battlepass
    """
    user_bp: list = user.setdefault("battlepass", [])

    # Fetch & validate active season
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

    # Find or initialize this season’s entry
    season_entry = next(
        (entry for entry in user_bp if entry.get("season_id") == season_id), None
    )
    if not season_entry:
        season_entry = {
            "season_id": season_id,
            "xp": 0,
            "claimed_levels": [],
        }
        user_bp.append(season_entry)
        logger.info(f"Initialized new battlepass entry for season {season_id}")

    # Update the XP counter
    old_xp = season_entry.get("xp", 0)
    new_xp = old_xp + xp
    season_entry["xp"] = new_xp
    logger.info(f"Battlepass '{season_id}' XP updated: {old_xp} → {new_xp}")

    # Update user_bp with new data
    for idx, entry in enumerate(user_bp):
        if entry.get("season_id") == season_id:
            # replace the existing entry in‐place
            user_bp[idx] = season_entry
            break

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
    """
    Retrieve currently active battlepass season.
    Finds battlepass with start_date before current time and end_date after current time.

    Parameters:
        dynamodb: DynamoDB table resource for battlepass

    Returns:
        Active battlepass document or None if not found
    """
    logger.info(f"Fetching active battlepass seasons")

    # Get current date/time in UTC to compare with battlepass dates
    current_date = datetime.now(timezone.utc)
    logger.debug(f"Current date: {current_date}")
    current_date_str = current_date.isoformat()

    # Query for active battlepass (current date between start and end dates)
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

    Parameters:
        started_at: ISO‑8601 UTC string, e.g. '2025-04-18T14:30:00Z'
        finished_at: same format

    Returns:
        difference in seconds (finished_at – started_at)
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
    Update the list of letters/words learned for a specific language.
    Only adds new unique letters that weren't already learned.

    Parameters:
        current_state: Dictionary mapping language codes to learned letters
                      e.g. {"en": ["A","B","C"], "hr": ["Z"]}
        language_id: Language code to update (e.g. "en" or "hr")
        new_letters: List of new letters/words to add

    Returns:
        Updated dictionary with new letters added
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
    Calculate XP and coins earned based on difficulty levels of correct answers.

    Parameters:
        correct_answers_versions: list of ints in [1,2,3] representing difficulty levels

    Returns:
        tuple (xp, coins), where
             xp    = 2 per level 1, 3 per level 2, 5 per level 3
             coins = floor(xp * random_multiplier) with multiplier in [1.0, 2.0]
    """
    logger.debug(f"Calculating XP and coins for versions: {correct_answers_versions}")

    # Map difficulty levels to XP values
    xp_map = {1: 2, 2: 3, 3: 5}
    logger.debug(f"XP map: {xp_map}")

    # Sum XP for all correct answers
    logger.info(f"Calculating XP for versions: {correct_answers_versions}")
    xp = sum(xp_map.get(v, 0) for v in correct_answers_versions)
    logger.debug(f"XP calculated: {xp}")

    # Apply random multiplier to determine coins
    multiplier = random.uniform(1.0, 2.0)

    logger.info(f"Calculating coins: {xp} * {multiplier}")
    coins = int(xp * multiplier)

    return xp, coins


def check_active_items(user, dynamodb):
    """
    Check if user has active items and remove any that are expired.

    Parameters:
        user: User document from DynamoDB
        dynamodb: DynamoDB table resource

    Returns:
        tuple (updated_active_items, was_item_removed)
          where updated_active_items is the new list or None if no items
          and was_item_removed is True if any expired items were removed
    """
    active_items = user.get("activated_items", [])
    if not active_items:
        logger.debug(f"User {user['email']} has no active items.")
        return None, False

    logger.info(f"User {user['email']} has active items: {active_items}")
    logger.info(f"Checking if active items are expired.")
    current_time = datetime.now(timezone.utc)

    item_removed = False

    # Check each item for expiration
    for item in active_items:
        if "expires_at" in item:
            expires_at = parse_utc_isoformat(item["expires_at"])
            if expires_at < current_time:
                logger.info(f"Item {item} has expired.")
                active_items.remove(item)
                item_removed = True

    logger.info(
        f"User {user['email']} has active items after expiration check: {active_items}"
    )
    return active_items, item_removed


def get_xp_multiplier(active_items):
    """
    Calculate the XP multiplier based on active items.
    Only applies the highest multiplier instead of stacking them.

    Args:
        active_items: List of user's activated items

    Returns:
        Maximum XP multiplier (default 1.0 if no multipliers found)
    """
    if not active_items:
        return Decimal("1.0")

    max_multiplier = Decimal("1.0")

    # Find the maximum multiplier from all active items
    for item in active_items:
        # Check if item has effects with a multiplier and is an XP boost
        if (
            item.get("category") == "xp"
            and "effects" in item
            and "multiplier" in item["effects"]
        ):
            # Update max_multiplier if this item has a higher multiplier
            item_multiplier = item["effects"]["multiplier"]
            max_multiplier = max(max_multiplier, item_multiplier)


    logger.info(f"XP multiplier: {max_multiplier}")
    return max_multiplier


def update_user_achievements(
    usersTable, achievementsTable, email, time_played, xp, letters_learned, achievements
):
    """
    Check for and award new achievements based on user's updated stats.

    Parameters:
        usersTable: DynamoDB table resource for users
        achievementsTable: DynamoDB table resource for achievements
        email: User's email
        time_played: User's total time played
        xp: User's total XP
        letters_learned: Dictionary of letters learned by language
        achievements: List of achievement IDs already earned

    Returns:
        List of newly earned achievement details, or empty list if none
    """
    logger.info(f"Checking for new achievements for user {email}")

    # Initialize achievements list if not present
    user_achievements = achievements
    if not user_achievements:
        user_achievements = []

    # Calculate total words/letters learned across all languages
    total_words_learned = sum(len(words_list) for words_list in letters_learned.values())
    total_words_learned = Decimal(str(total_words_learned))

    new_achievements = []
    new_achievements_details = []

    # Check each achievement type (time, XP, words learned)
    achievement_types = [
        {"type": "time_played", "value": time_played},
        {"type": "xp", "value": xp},
        {"type": "words", "value": total_words_learned},
    ]

    for achievement_type in achievement_types:
        # Query for achievements of this type that user has met requirements for
        response = achievementsTable.table.scan(
            FilterExpression=Attr("type").eq(achievement_type["type"])
            & Attr("requires").lte(achievement_type["value"])
        )

        # Sort achievements by requires in descending order
        # (to ensure we award the highest tier first)
        achievements = sorted(
            response.get("Items", []), key=lambda a: a.get("requires", 0), reverse=True
        )

        for achievement in achievements:
            # If an achievement is found that the user already has, break the loop
            if achievement["id"] in user_achievements:
                break

            # Otherwise, add this achievement
            new_achievements.append(achievement["id"])
            new_achievements_details.append(achievement)
            user_achievements.append(achievement["id"])

    # Update user if new achievements were earned
    if new_achievements:
        logger.info(f"User {email} earned new achievements: {new_achievements}")
        usersTable.table.update_item(
            Key={"email": email},
            UpdateExpression="SET achievements = :achievements",
            ExpressionAttributeValues={":achievements": user_achievements},
        )

    return new_achievements_details