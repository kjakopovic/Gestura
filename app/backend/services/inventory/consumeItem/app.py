import logging
import random

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response, convert_decimal_to_float
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE, _LAMBDA_ITEMS_TABLE_RESOURCE
from middleware import middleware
from auth import get_email_from_jwt_token
from datetime import datetime, timezone, timedelta
from decimal import Decimal

logger = logging.getLogger("consumeItem")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    item_id: str


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

    # Get the item ID to consume from query parameters
    use_item_id = query_params.get("item_id")

    # Initialize DynamoDB clients for users and items table
    global _LAMBDA_USERS_TABLE_RESOURCE, _LAMBDA_ITEMS_TABLE_RESOURCE
    users_dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    items_dynamodb = LambdaDynamoDBClass(_LAMBDA_ITEMS_TABLE_RESOURCE)

    # Process the item consumption request
    return consume_item(users_dynamodb, items_dynamodb, email, use_item_id)


def consume_item(users_dynamodb, items_dynamodb, email, item_id):
    """
    Process an item consumption request and apply its effects to the user.

    Parameters:
        users_dynamodb (LambdaDynamoDBClass): DynamoDB client for users table
        items_dynamodb (LambdaDynamoDBClass): DynamoDB client for items table
        email (str): User's email
        item_id (str): ID of the item to consume

    Returns:
        dict: HTTP response with result of the consumption operation
    """
    logger.debug(f"Consuming item {item_id} for user {email}")

    # Fetch user data from DynamoDB
    user = get_user_by_email(users_dynamodb, email)
    if not user:
        logger.error(f"User not found: {email}")
        return build_response(404, {"message": "User not found"})

    # Check if user has the item in their inventory
    user_items_inventory = user.get("items_inventory", [])
    item_to_consume = item_id if item_id in user_items_inventory else None

    if not item_to_consume:
        logger.error(f"Item with ID {item_id} not found in user's inventory.")
        return build_response(404, {"message": "Item not found in user's inventory."})

    # Fetch item details from items table
    item_info = items_dynamodb.table.get_item(Key={"id": item_id})
    item_info = item_info.get("Item")

    if not item_info:
        logger.error(f"Item with ID {item_id} not found in items table.")
        return build_response(404, {"message": "Item not found in items table."})

    # Get users currently active items and their effects
    activated_items = user.get("activated_items", [])
    item_category = item_info.get("category", "").lower()
    item_effects = item_info.get("effect", {})

    # Prepare for DynamoDB update
    update_parts = []
    expression_attribute_values = {}

    # Process item based on its category
    if item_category == "coins":
        # Apply coin effects - add coins to user's balance
        logger.info(f"Item {item_id} is a coin item. Updating user's coins.")
        user_coins = user.get("coins", 0)
        item_coins = item_effects.get("coins", 0)

        update_parts = ["coins = :coins"]
        expression_attribute_values[":coins"] = user_coins + item_coins

    elif item_category == "hearts":
        # Apply heart effects - add hearts to user's heart balance (max 5)
        logger.info(f"Item {item_id} is a heart item. Updating user's hearts.")
        user_hearts = user.get("hearts", 0)

        # If hearts are already at max, return an error
        # Else update hearts based on item effects
        if user_hearts >= 5:
            logger.warning(f"User {email} already has maximum hearts.")
            return build_response(400, {"message": "User already has maximum hearts."})

        item_hearts = item_effects.get("multiplier", 0)
        if user_hearts + item_hearts > 5:
            update_parts.append("hearts = :hearts")
            expression_attribute_values[":hearts"] = 5
        else:
            update_parts.append("hearts = :hearts")
            expression_attribute_values[":hearts"] = user_hearts + item_hearts

    elif item_category == "chest":
        # Open chest to get a random item based on win percentages
        possible_items = item_effects.get("items", [])
        if not possible_items:
            logger.error(f"Item {item_id} has no possible items.")
            return build_response(400, {"message": "Item has no possible items."})

        # Select a random item from the chest based on win percentages
        won_item = select_random_item_from_chest(possible_items)
        logger.info(f"User {email} won {won_item} from chest {item_id}")

        if "coins" in won_item:
            # If the won item is coins, add them to user's balance
            user_coins = user.get("coins", 0)
            update_parts.append("coins = :coins")
            expression_attribute_values[":coins"] = user_coins + won_item["coins"]
        else:
            # If the won item is not coins, add it to user's inventory
            logger.info(f"Adding item {won_item} to user's inventory")
            # Create a new inventory item with a unique ID if not provided
            new_inventory_item = {
                "item_id": won_item.get("item_id", f"chest-reward-{random.randint(1000, 9999)}"),
                "quantity": Decimal('1'),
                "acquired_date": datetime.now(timezone.utc).isoformat()
            }

            user_items_inventory.append(new_inventory_item)

    else:
        # Handle other item types (buffs, powerups, etc.)
        logger.info(f"Consuming item {item_id} of category {item_category}.")

        if not activated_items:
            # User has no activated items - create new activated items list
            logger.debug(f"User {email} has no activated items. Adding item {item_id}.")

            # Calculate item expiration time based on seconds_in_use value
            seconds_in_use = item_effects.get("seconds_in_use", 0)
            item_effects.pop("seconds_in_use", None)    # Remove this field from effects
            seconds_in_use = int(seconds_in_use)

            current_time = datetime.now(timezone.utc)
            expires_at = current_time + timedelta(seconds=seconds_in_use)

            # Create new activated item entry
            new_activated_item = {
                "category": item_category,
                "effects": item_effects,
                "expires_at": expires_at.isoformat()
            }

            update_parts.append("activated_items = :activated_items")
            expression_attribute_values[":activated_items"] = [new_activated_item]

        else:
            # User already has activated items - add new item to list
            logger.debug(f"User {email} has activated items. Adding new activated item {item_id}.")

            # Calculate item expiration time based on seconds_in_use value
            seconds_in_use = item_effects.get("seconds_in_use", 0)
            seconds_in_use = int(seconds_in_use)
            item_effects.pop("seconds_in_use", None)    # Remove this field from effects

            current_time = datetime.now(timezone.utc)
            expires_at = current_time + timedelta(seconds=seconds_in_use)

            new_activated_item = {
                "category": item_category,
                "effects": item_effects,
                "expires_at": expires_at.isoformat()
            }

            activated_items.append(new_activated_item)

            update_parts.append("activated_items = :activated_items")
            expression_attribute_values[":activated_items"] = activated_items

    # Remove the consumed item from inventory
    if item_id in user_items_inventory:
        user_items_inventory.remove(item_id)
    update_parts.append("items_inventory = :inventory")
    expression_attribute_values[":inventory"] = user_items_inventory

    # Construct and execute DynamoDB update expression
    update_expression = "SET " + ", ".join(update_parts)
    logger.debug(f"Update expression: {update_expression}")

    users_dynamodb.table.update_item(
        Key={"email": email},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
    )

    logger.info(f"Item {item_id} consumed successfully for user {email}.")
    return build_response(200, {"message": "Item consumed successfully."})


def get_user_by_email(dynamodb, email):
    """
    Retrieve user data from DynamoDB by email address.

    Parameters:
        dynamodb (LambdaDynamoDBClass): DynamoDB client for users table
        email (str): User's email to look up

    Returns:
        dict: User data or None if user not found
    """
    logger.info(f"Getting user by email: {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    return user.get("Item")


def select_random_item_from_chest(chest_items):
    """
    Randomly select an item from a chest based on win percentages.

    Parameters:
        chest_items (list): List of possible items with their win percentages

    Returns:
        dict: The randomly selected item based on weighted probabilities
    """
    items = []
    weights = []

    # Extract items and their win percentages
    for item in chest_items:
        items.append(item)
        weights.append(float(item.get("win_percentage", 0)))

    # Validate that probabilities roughly sum to 100%
    total_weight = sum(weights)
    if abs(total_weight - 100) > 0.01:
        logger.warning(f"Warning: Win percentages sum to {total_weight}, not 100")

    # Select a random item based on weights (win percentages)
    chosen_item = random.choices(items, weights=weights, k=1)[0]
    logger.info(f"Chosen item: {chosen_item}")

    return chosen_item