import logging
import json
import random
from datetime import datetime, timezone
from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import validate, SchemaValidationError
from common import build_response, parse_utc_isoformat
from auth import get_email_from_jwt_token
from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_LANGUAGES_TABLE_RESOURCE,
    _LAMBDA_USERS_TABLE_RESOURCE,
)
from middleware import middleware
from typing import List
from decimal import Decimal

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
    print(f"JWT token: {jwt_token}")
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
    languagesTable = LambdaDynamoDBClass(_LAMBDA_LANGUAGES_TABLE_RESOURCE)
    usersTable = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

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

    xp, coins = calculate_xp_and_coins(request.correct_answers_versions)
    xp = Decimal(str(xp))
    coins = Decimal(str(coins))

    logger.info(
        f"Updating user {email} with time played: {time_played}, task level: {user['task_level'] + 1}, letters learned: {letters_learned}"
    )
    update_user(
        usersTable,
        email,
        user["time_played"] + time_played,
        user["task_level"],
        letters_learned,
        user["xp"] + xp,
        user["battlepass_xp"] + xp,
        user["coins"] + coins,
    )

    return build_response(
        200,
        {
            "message": "Level completed successfully",
        },
    )


def get_language_by_id(dynamodb, id):
    logger.info(f"Getting language by id {id}")
    language = dynamodb.table.get_item(Key={"id": id})

    language_item = language.get("Item", {})

    return language_item


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})

    return user_item


def update_user(
    dynamodb, email, time_played, task_level, letters_learned, xp, battlepass_xp, coins
):
    logger.info(f"Updating user with email: {email}")

    update_expression = "SET "
    expression_attribute_values = {}

    logger.debug(f"Updating time played to {time_played}")
    update_expression += "time_played = :time_played, "
    expression_attribute_values[":time_played"] = time_played

    logger.debug(f"Updating task level to {task_level+1}")
    update_expression += "task_level = :task_level, "
    expression_attribute_values[":task_level"] = task_level + 1

    logger.debug(f"Updating letters learned to {letters_learned}")
    update_expression += "letters_learned = :letters_learned, "
    expression_attribute_values[":letters_learned"] = letters_learned

    logger.debug(f"Updating xp to {xp}")
    update_expression += "xp = :xp, "
    expression_attribute_values[":xp"] = xp

    logger.debug(f"Updating battlepass_xp to {battlepass_xp}")
    update_expression += "battlepass_xp = :battlepass_xp, "
    expression_attribute_values[":battlepass_xp"] = battlepass_xp

    logger.debug(f"Updating coins to {coins}")
    update_expression += "coins = :coins, "
    expression_attribute_values[":coins"] = coins

    dynamodb.table.update_item(
        Key={"email": email},
        UpdateExpression=update_expression.rstrip(", "),
        ExpressionAttributeValues=expression_attribute_values,
    )


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
