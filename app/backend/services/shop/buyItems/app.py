import logging
import json

from common import build_response, convert_decimal_to_float
from middleware import middleware
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE, _LAMBDA_ITEMS_TABLE_RESOURCE
from auth import get_email_from_jwt_token
from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate


logger = logging.getLogger("BuyItems")
logger.setLevel(logging.INFO)


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

    global _LAMBDA_USERS_TABLE_RESOURCE, _LAMBDA_ITEMS_TABLE_RESOURCE
    users_dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    items_dynamodb = LambdaDynamoDBClass(_LAMBDA_ITEMS_TABLE_RESOURCE)

    return buy_item(items_dynamodb, users_dynamodb, request.item_id, email)


def buy_item(items_dynamodb, users_dynamodb, item_id, email):
    user = get_user_by_email(users_dynamodb, email)

    if user is None:
        logger.error(f"User with email {email} does not exist")
        return build_response(404, {"message": "User not found."})

    available_coins = user.get("coins", 0)

    shop_item = get_item_by_id(items_dynamodb, item_id)
    if shop_item is None:
        logger.error(f"Item with id {item_id} does not exist")
        return build_response(404, {"message": "Item not found."})

    item_category = shop_item.get("category")

    if item_category == "coins":
        item_effect = shop_item.get("effect")
        add_coins = item_effect.get("coins")
        add_coins = convert_decimal_to_float(add_coins)
        add_coins = int(add_coins)

        if add_coins <= 0:
            logger.error(f"Invalid coins amount {add_coins}")
            return build_response(400, {"message": "Invalid coins amount"})

        available_coins += add_coins
        updated_coins = update_user_coins(users_dynamodb, email, available_coins)

        if updated_coins:
            logger.info(f"User {email} bought coins successfully")
            return build_response(200, {"message": "Coins added successfully"})
    else:
        item_price = shop_item.get("price")
        item_price = convert_decimal_to_float(item_price)
        item_price = int(item_price)

        if available_coins < item_price:
            logger.error(f"User {email} does not have enough coins to buy the item")
            return build_response(400, {"message": "Not enough coins"})

        available_coins -= item_price
        updated_coins = update_user_coins(users_dynamodb, email, available_coins)

        if not updated_coins:
            logger.error(f"Failed to update coins for user {email}")
            return build_response(500, {"message": "Failed to update coins"})

        return add_item_to_user(users_dynamodb, email, item_id)

    return build_response(500, {"message": "Failed to process the request"})


def update_user_coins(dynamodb, email, coins):
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
    logger.info(f"Adding item {item_id} to user {email}")

    update_expression = "SET items_inventory = list_append(if_not_exists(items_inventory, :empty_list), :new_item)"
    expression_attribute_values = {
        ":new_item": [item_id],
        ":empty_list": []
    }

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