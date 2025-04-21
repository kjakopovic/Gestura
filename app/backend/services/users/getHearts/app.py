import logging

from datetime import datetime, timedelta
from common import build_response
from middleware import middleware
from boto import LambdaDynamoDBClass, _LAMBDA_USERS_TABLE_RESOURCE
from auth import get_email_from_jwt_token

from services.users.consumeHeart.app import get_user_by_email

logger = logging.getLogger("GetHearts")
logger.setLevel(logging.DEBUG)


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    jwt_token = event.get("headers").get("x-access-token")
    print(f"JWT token: {jwt_token}")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    global _LAMBDA_USERS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

    hearts, hearts_next_refill = get_user_by_email(dynamodb, email)

    if not hearts and hearts != 0:
        logger.debug(f"User with email {email} not found.")
        return build_response(404, {"message": "User not found."})

    if hearts == 5:
        logger.debug(f"User with email {email} has 5 hearts")
        return build_response(200, { "hearts": hearts })

    # TODO: Check if there will be problems here related to the time data format
    current_time = datetime.now()
    logger.debug(f"Current time: {current_time}")

    filled_hearts = False
    while hearts_next_refill < current_time or hearts < 5:
        hearts += 1
        hearts_next_refill += timedelta(hours=3)
        filled_hearts = True

    if hearts == 5:
        hearts_next_refill = None

    if filled_hearts:
        update_expression = "SET hearts = :val"
        expression_attribute_values = {":val": hearts}
        update_expression += ", hearts_next_refill = :refill_time"
        expression_attribute_values[":refill_time"] = hearts_next_refill.isoformat()

        dynamodb.table.update_item(
            Key={"email": email},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
        )

        logger.debug(f"Updated hearts for user: {email}. Remaining hearts: {hearts}")
        return build_response(
            200,
            {
                "message": "Fetched hearts successfully",
                "data": {
                    "hearts": hearts,
                    "hearts_next_refill": hearts_next_refill.isoformat(),
                },
            },
        )

    logger.debug(f"Fetched hearts for user: {email}. Remaining hearts: {hearts}")
    return build_response (
        200,
        {
            "message": "Fetched hearts successfully",
            "data": {
                "hearts": hearts,
                "hearts_next_refill": hearts_next_refill,
                },
            },
        )


def get_user_by_email(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})

    if user_item:
        hearts = user_item.get("hearts", 0)
        hearts_next_refill = user_item.get("hearts_next_refill", 0)
        return hearts, hearts_next_refill
    else :
        logger.error(f"User with email {email} not found")
        return None


def update_user_hearts(dynamodb, email, hearts, hearts_next_refill):
    #TODO: implement this
    return