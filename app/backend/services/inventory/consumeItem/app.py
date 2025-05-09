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

    use_item_id = query_params.get("item_id")

    global _LAMBDA_USERS_TABLE_RESOURCE, _LAMBDA_ITEMS_TABLE_RESOURCE
    users_dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    items_dynamodb = LambdaDynamoDBClass(_LAMBDA_ITEMS_TABLE_RESOURCE)

    return consume_item(users_dynamodb, items_dynamodb, email, use_item_id)


def consume_item(users_dynamodb, items_dynamodb, email, item_id):
    logger.debug(f"Consuming item {item_id} for user {email}")

    user = get_user_by_email(users_dynamodb, email)
    if not user:
        logger.error(f"User not found: {email}")
        return build_response(404, {"message": "User not found"})

    user_items_inventory = user.get("items_inventory", [])

    item_to_consume = item_id if item_id in user_items_inventory else None

    if not item_to_consume:
        logger.error(f"Item with ID {item_id} not found in user's inventory.")
        return build_response(404, {"message": "Item not found in user's inventory."})

    item_info = items_dynamodb.table.get_item(Key={"id": item_id})
    item_info = item_info.get("Item")

    if not item_info:
        logger.error(f"Item with ID {item_id} not found in items table.")
        return build_response(404, {"message": "Item not found in items table."})

    activated_items = user.get("activated_items", [])
    item_category = item_info.get("category", "").lower()
    item_effects = item_info.get("effect", {})

    update_parts = []
    expression_attribute_values = {}

    if item_category == "coins":
        logger.info(f"Item {item_id} is a coin item. Updating user's coins.")
        user_coins = user.get("coins", 0)
        item_coins = item_effects.get("coins", 0)

        update_parts = ["coins = :coins"]
        expression_attribute_values[":coins"] = user_coins + item_coins
    elif item_category == "hearts":
        logger.info(f"Item {item_id} is a heart item. Updating user's hearts.")
        user_hearts = user.get("hearts", 0)

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
        possible_items = item_effects.get("items", [])
        if not possible_items:
            logger.error(f"Item {item_id} has no possible items.")
            return build_response(400, {"message": "Item has no possible items."})

        won_item = select_random_item_from_chest(possible_items)

        logger.info(f"User {email} won {won_item} from chest {item_id}")

        if "coins" in won_item:
            user_coins = user.get("coins", 0)
            update_parts.append("coins = :coins")
            expression_attribute_values[":coins"] = user_coins + won_item["coins"]
        else:
            logger.info(f"Adding item {won_item} to user's inventory")
            # Create a new inventory item
            new_inventory_item = {
                "item_id": won_item.get("item_id", f"chest-reward-{random.randint(1000, 9999)}"),
                "quantity": Decimal('1'),
                "acquired_date": datetime.now(timezone.utc).isoformat()
            }

            user_items_inventory.append(new_inventory_item)
    else:
        logger.info(f"Consuming item {item_id} of category {item_category}.")

        if not activated_items:
            logger.debug(f"User {email} has no activated items. Adding item {item_id}.")

            seconds_in_use = item_effects.get("seconds_in_use", 0)
            item_effects.pop("seconds_in_use", None)
            seconds_in_use = int(seconds_in_use)

            current_time = datetime.now(timezone.utc)
            expires_at = current_time + timedelta(seconds=seconds_in_use)

            new_activated_item = {
                "category": item_category,
                "effects": item_effects,
                "expires_at": expires_at.isoformat()
            }

            update_parts.append("activated_items = :activated_items")
            expression_attribute_values[":activated_items"] = [new_activated_item]
        else:
            logger.debug(f"User {email} has activated items. Adding new activated item {item_id}.")

            seconds_in_use = item_effects.get("seconds_in_use", 0)
            seconds_in_use = int(seconds_in_use)
            item_effects.pop("seconds_in_use", None)

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

    if item_id in user_items_inventory:
        user_items_inventory.remove(item_id)
    update_parts.append("items_inventory = :inventory")
    expression_attribute_values[":inventory"] = user_items_inventory

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
    logger.info(f"Getting user by email: {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    return user.get("Item")


def select_random_item_from_chest(chest_items):
    items = []
    weights = []

    for item in chest_items:
        items.append(item)
        weights.append(float(item.get("win_percentage", 0)))

    total_weight = sum(weights)
    if abs(total_weight - 100) > 0.01:
        logger.warning(f"Warning: Win percentages sum to {total_weight}, not 100")

    chosen_item = random.choices(items, weights=weights, k=1)[0]
    logger.info(f"Chosen item: {chosen_item}")

    return chosen_item