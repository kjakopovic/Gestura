import logging
import json

from common import build_response, convert_decimal_to_float
from middleware import middleware
from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_USERS_TABLE_RESOURCE,
    _LAMBDA_ITEMS_TABLE_RESOURCE,
)
from auth import get_email_from_jwt_token
from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate


logger = logging.getLogger("BuyItems")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    item_id: str


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    # Extract JWT token from headers and authenticate the user
    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    # Parse and validate the request body against JSON schema
    body = event.get("body")
    if body is not None:
        request_body = json.loads(body)
    else:
        request_body = event

    try:
        logger.debug(f"Validating request {request_body}")
        validate(event=request_body, schema=schema)
    except SchemaValidationError as e:
        logger.error(f"Validation failed: {e}")
        return build_response(400, {"message": str(e)})

    logger.info("Parsing request body")
    request = Request(**request_body)

    # Initialize DynamoDB table resources
    global _LAMBDA_USERS_TABLE_RESOURCE, _LAMBDA_ITEMS_TABLE_RESOURCE
    users_dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    items_dynamodb = LambdaDynamoDBClass(_LAMBDA_ITEMS_TABLE_RESOURCE)

    # Process the purchase request
    return buy_item(items_dynamodb, users_dynamodb, request.item_id, email)


def buy_item(items_dynamodb, users_dynamodb, item_id, email):
    """
    Process the purchase of an item by a user.

    Args:
        items_dynamodb: DynamoDB items table instance
        users_dynamodb: DynamoDB users table instance
        item_id: ID of the item being purchased
        email: User's email

    Returns:
        dict: HTTP response with status code and message
    """
    user = get_user_by_email(users_dynamodb, email)
    if user is None:
        logger.error(f"User with email {email} does not exist")
        return build_response(404, {"message": "User not found."})

    available_coins = user.get("coins", 0)

    # Check if the item exists in the items table
    shop_item = get_item_by_id(items_dynamodb, item_id)
    if shop_item is None:
        logger.error(f"Item with id {item_id} does not exist")
        return build_response(404, {"message": "Item not found."})

    # Fetch items category in order to determine how to process the purchase
    item_category = shop_item.get("category")

    # Case 1:
    # User is trying to buy an item from coins category
    if item_category == "coins":
        item_effect = shop_item.get("effect")
        add_coins = item_effect.get("coins")
        add_coins = convert_decimal_to_float(add_coins)
        add_coins = int(add_coins)

        # Check if the amount of coins to add is valid
        if add_coins <= 0:
            logger.error(f"Invalid coins amount {add_coins}")
            return build_response(400, {"message": "Invalid coins amount"})

        # Update the user's coins
        available_coins += add_coins
        updated_coins = update_user_coins(users_dynamodb, email, available_coins)

        # Check if the coins were updated successfully and return the appropriate response
        if updated_coins:
            logger.info(f"User {email} bought coins successfully")
            return build_response(200, {"message": "Coins added successfully"})

    # Case 2:
    # User is trying to buy an item from items category
    else:
        item_price = shop_item.get("price")
        item_price = convert_decimal_to_float(item_price)
        item_price = int(item_price)

        # Check if the item price is valid
        if available_coins < item_price:
            logger.error(f"User {email} does not have enough coins to buy the item")
            return build_response(400, {"message": "Not enough coins"})

        # Update the user's coins
        available_coins -= item_price
        updated_coins = update_user_coins(users_dynamodb, email, available_coins)

        # Check if the coins were updated successfully and return the appropriate response
        if not updated_coins:
            logger.error(f"Failed to update coins for user {email}")
            return build_response(500, {"message": "Failed to update coins"})

        # Add the item to the user's inventory
        return add_item_to_user(users_dynamodb, email, item_id)

    # If none of the cases matched, return an error response
    return build_response(500, {"message": "Failed to process the request"})


def update_user_coins(dynamodb, email, coins):
    """
    Update a user's coin balance in DynamoDB.

    Args:
        dynamodb: DynamoDB users table instance
        email: User's email
        coins: New coin balance

    Returns:
        Boolean indicating success
    """
    logger.info(f"Updating user {email} with coins {coins}")

    update_expression = "SET coins = :coins"
    expression_attribute_values = {":coins": coins}

    dynamodb.table.update_item(
        Key={"email": email},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
    )

    return True


def add_item_to_user(dynamodb, email, item_id):
    """
    Add a purchased item to the user's inventory.

    Args:
        dynamodb: DynamoDB users table instance
        email: User's email
        item_id: ID of the purchased item

    Returns:
        dict: HTTP response with status code and message
    """
    logger.info(f"Adding item {item_id} to user {email}")

    update_expression = "SET items_inventory = list_append(if_not_exists(items_inventory, :empty_list), :new_item)"
    expression_attribute_values = {":new_item": [item_id], ":empty_list": []}

    dynamodb.table.update_item(
        Key={"email": email},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
    )

    return build_response(200, {"message": "Item added successfully"})


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    return user.get("Item")


def get_item_by_id(dynamodb, id):
    logger.info(f"Getting item by id {id}")
    shop_item = dynamodb.table.get_item(Key={"id": id})

    return shop_item.get("Item")
