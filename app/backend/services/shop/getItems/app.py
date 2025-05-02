import logging

from common import build_response, convert_decimal_to_float
from middleware import middleware
from boto import LambdaDynamoDBClass, _LAMBDA_ITEMS_TABLE_RESOURCE
from auth import get_email_from_jwt_token

logger = logging.getLogger("GetItems")
logger.setLevel(logging.DEBUG)


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    global _LAMBDA_ITEMS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_ITEMS_TABLE_RESOURCE)

    items = get_items(dynamodb)

    if not items:
        logger.debug(f"No items found.")
        return build_response(404, {"message": "No items found."})

    regular_items = []
    coins = []
    chests = []

    for item in items:
        category = item.get("category", "").lower()
        processed_item = convert_decimal_to_float(item)

        if category == "coins":
            coins.append(processed_item)
        elif category == "chest":
            chests.append(processed_item)
        else:
            regular_items.append(processed_item)

    return build_response(
        200,
        {
            "message": "Items fetched successfully",
            "items": regular_items,
            "coins": coins,
            "chests": chests,
        },
    )


def get_items(dynamodb):
    logger.info(f"Getting all shop items")
    items = dynamodb.table.scan()
    items_list = items.get("Items", [])
    return items_list
