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

    # Extract and validate JWT token to get user email
    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    # Validate query parameters against schema
    query_params = event.get("queryStringParameters", {})
    try:
        logger.debug(f"Validating query params: {query_params}")

        validate(event=query_params, schema=schema)
    except SchemaValidationError as e:
        logger.error(f"Validation failed: {e}")
        return build_response(400, {"message": str(e)})

    # Initialize DynamoDB clients
    global _LAMBDA_USERS_TABLE_RESOURCE, _LAMBDA_BATTLEPASS_TABLE_RESOURCE
    user_dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    battlepass_dynamodb = LambdaDynamoDBClass(_LAMBDA_BATTLEPASS_TABLE_RESOURCE)

    claim_level = Decimal(query_params.get("battlepass_level"))

    return claim_battlepass_level(user_dynamodb, battlepass_dynamodb, email, claim_level)


def claim_battlepass_level(user_dynamodb, battlepass_dynamodb, email, claim_level):
    """
    Process a user's battlepass level claim request.

    Parameters:
        user_dynamodb (LambdaDynamoDBClass): DynamoDB client for users table
        battlepass_dynamodb (LambdaDynamoDBClass): DynamoDB client for battlepass table
        email (str): User's email
        claim_level (Decimal): Battlepass level to claim

    Returns:
        dict: HTTP response with result of the claim operation
    """
    logger.debug(f"Claiming battlepass level {claim_level} for user {email}")

    # Fetch user data
    user = get_user_by_email(user_dynamodb, email)
    if not user:
        logger.error(f"User not found: {email}")
        return build_response(404, {"message": "User not found"})

    # Fetch active battlepass season
    active_battlepass = get_active_battlepass_seasons(battlepass_dynamodb)
    if not active_battlepass:
        logger.debug(f"No active battlepasses found.")
        return build_response(404, {"message": "No active battlepasses found."})

    # Find requested battlepass level in active battlepass
    battlepass_levels = active_battlepass.get("levels", [])
    battlepass_level = next(
        (level for level in battlepass_levels if level.get("level") == claim_level), None
    )
    if not battlepass_level:
        logger.error(f"Battlepass level not found: {claim_level}")
        return build_response(404, {"message": "Battlepass level not found"})

    battlepass_season_id = active_battlepass.get("season", None)
    if not battlepass_season_id:
        logger.error(f"Battlepass season ID not found: {battlepass_season_id}")
        return build_response(404, {"message": "Battlepass season ID not found"})

    # Calculate required XP for the requested level
    required_xp = 0
    for level in battlepass_levels:
        level_number = level.get("level")
        if level_number <= claim_level:
            required_xp += level.get("required_xp", 0)
        else:
            break

    # Get or create user battlepass data for current season
    user_battlepasses = user.get("battlepass", [])
    user_battlepass = next(
        (bp for bp in user_battlepasses if bp.get("season_id") == battlepass_season_id), None
    )

    if not user_battlepass:
        logger.info(f"User battlepass not found for season ID: {battlepass_season_id}."
                    f" Adding new battlepass season to user.")

        unlocked_levels = []
        locked_levels = [level.get("level") for level in battlepass_levels]
        current_level = 0

        new_battlepass = {
            "season_id": battlepass_season_id,
            "xp": 0,
            "claimed_levels": [],
            "current_level": current_level,
            "unlocked_levels": unlocked_levels,
            "locked_levels": locked_levels
        }

        user_battlepasses.append(new_battlepass)

        # Update user battlepass data in DynamoDB
        user_dynamodb.table.update_item(
            Key={"email": email},
            UpdateExpression="SET battlepass = :battlepass",
            ExpressionAttributeValues={
                ":battlepass": user_battlepasses
            }
        )

        user_battlepass = new_battlepass
        logger.info(f"New battlepass season added to user: {user_battlepass}")

    # Check if user has enough XP to claim the level
    user_xp = user_battlepass.get("xp", 0)
    if user_xp < required_xp:
        logger.error(f"User does not have enough XP to claim level {claim_level}")
        return build_response(400, {"message": "Not enough XP to claim this level"})

    # Check if the level has already been claimed
    claimed_levels = user_battlepass.get("claimed_levels", [])
    unlocked_levels = user_battlepass.get("unlocked_levels", [])
    locked_levels = user_battlepass.get("locked_levels", [])

    # Check if the level is already claimed
    if claim_level in claimed_levels:
        logger.error(f"Battlepass level {claim_level} has already been claimed.")
        return build_response(400, {"message": f"Battlepass level {claim_level} has already been claimed."})

    # Check if level is unlocked
    if claim_level not in unlocked_levels or claim_level in locked_levels:
        logger.error(f"Battlepass level {claim_level} is not available for claiming.")
        return build_response(400, {"message": f"Battlepass level {claim_level} is not unlocked."})

    # Process rewards from the claimed level and update user data
    user_coins = user.get("coins", 0)
    level_coins = battlepass_level.get("coins", 0)

    user_coins += level_coins
    claimed_levels.append(int(claim_level))

    current_level = 0
    unlocked_levels = []
    locked_levels = []
    current_xp = 0
    for level in sorted(battlepass_levels, key=lambda x: x.get("level")):
        level_number = level.get("level")
        level_required_xp = level.get("required_xp", 0)
        current_xp += level_required_xp

        if user_xp >= current_xp:
            current_level = level_number
            unlocked_levels.append(level_number)
        else:
            locked_levels.append(level_number)

    for i, bp in enumerate(user_battlepasses):
        if bp.get("season_id") == battlepass_season_id:
            user_battlepasses[i]["claimed_levels"] = claimed_levels

    # Save updated user data to database
            user_battlepasses[i]["current_level"] = current_level
            user_battlepasses[i]["unlocked_levels"] = unlocked_levels
            user_battlepasses[i]["locked_levels"] = locked_levels

    user_dynamodb.table.update_item(
        Key={"email": email},
        UpdateExpression="SET coins = :coins, battlepass = :battlepass",
        ExpressionAttributeValues={
            ":coins": user_coins,
            ":battlepass": user_battlepasses
        }
    )

    logger.info(f"User {email} claimed battlepass level {claim_level} and received {level_coins} coins")
    return build_response(
        200,
        {
            "message": f"Battlepass level {claim_level} claimed successfully",
        }
    )


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email: {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    return user.get("Item")


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

    current_date = datetime.now(timezone.utc)
    logger.debug(f"Current date: {current_date}")
    current_date_str = current_date.isoformat()

    response = dynamodb.table.scan(
        FilterExpression=Attr("start_date").lte(current_date_str) & Attr("end_date").gte(current_date_str)
    )

    active_battlepasses = response.get("Items", [])
    logger.debug(f"Found {len(active_battlepasses)} active battlepasses")

    return active_battlepasses[0] if active_battlepasses else None