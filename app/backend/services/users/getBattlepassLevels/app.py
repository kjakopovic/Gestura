import logging

from datetime import datetime, timezone
from common import build_response, parse_utc_isoformat, convert_decimal_to_float
from boto import LambdaDynamoDBClass, _LAMBDA_BATTLEPASS_TABLE_RESOURCE
from middleware import middleware
from auth import get_email_from_jwt_token
from boto3.dynamodb.conditions import Attr

logger = logging.getLogger("GetBattlepassLevels")
logger.setLevel(logging.DEBUG)


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    global _LAMBDA_BATTLEPASS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_BATTLEPASS_TABLE_RESOURCE)

    active_battlepasses = get_active_battlepass_seassons(dynamodb)

    if not active_battlepasses:
        logger.debug(f"No active battlepasses found.")
        return build_response(404, {"message": "No active battlepasses found."})

    converted_active_battlepasses = convert_decimal_to_float(active_battlepasses)

    return build_response(
        200,
        {
            "message": "Fetched battlepasses successfully",
            "battlepasses": converted_active_battlepasses
        }
    )


def get_active_battlepass_seassons(dynamodb):
    logger.info(f"Fetching active battlepass seasons")

    current_date = datetime.now(timezone.utc)
    logger.debug(f"Current date: {current_date}")
    current_date_str = current_date.isoformat()

    response = dynamodb.table.scan(
        FilterExpression=Attr("start_date").lte(current_date_str) & Attr("end_date").gte(current_date_str)
    )

    active_battlepasses = response.get("Items", [])
    logger.debug(f"Found {len(active_battlepasses)} active battlepasses")
    print(f"Found {len(active_battlepasses)} active battlepasses")
    print(f"Active battlepasses: {active_battlepasses}")

    return active_battlepasses
