import json
import logging
from decimal import Decimal

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response, convert_decimal_to_float
from boto import LambdaDynamoDBClass, _LAMBDA_ACHIEVEMENTS_TABLE_RESOURCE
from middleware import middleware
from auth import get_email_from_jwt_token
from boto3.dynamodb.conditions import Key

logger = logging.getLogger("GetAchievements")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    query_page_size: str
    next_token: str


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
    global _LAMBDA_ACHIEVEMENTS_TABLE_RESOURCE
    achievements_dynamodb = LambdaDynamoDBClass(_LAMBDA_ACHIEVEMENTS_TABLE_RESOURCE)

    # Extract query parameters
    page_size = int(query_params.get("query_page_size", 10))
    next_token = query_params.get("next_token", None)

    return get_achievements(achievements_dynamodb, page_size, next_token)


def get_achievements(dynamodb, page_size, next_token):
    """
    Retrieve achievements with pagination.

    Parameters:
        dynamodb (LambdaDynamoDBClass): DynamoDB client for achievements table
        page_size (int): Number of items to return per page
        next_token (str): Token for retrieving the next page (optional)

    Returns:
        dict: HTTP response with achievements data and next page token
    """
    logger.info(f"Fetching achievements with page size: {page_size} and next token: {next_token}")

    scan_params = {
        "Limit": page_size,
    }

    # If next_token is provided, decode it and add to scan_params
    if next_token:
        try:
            exclusive_start_key = json.loads(next_token)
            scan_params["ExclusiveStartKey"] = exclusive_start_key
            logger.debug(f"Using ExclusiveStartKey: {exclusive_start_key}")
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding next token: {e}")
            return build_response(400, {"message": "Invalid pagination token"})

    response = dynamodb.table.scan(**scan_params)

    achievements = response.get("Items", [])
    logger.debug(f"Fetched achievements: {achievements}")

    # Convert Decimal values to float for JSON serialization
    converted_achievements = [convert_decimal_to_float(item) for item in achievements]

    result = {
        "achievements": converted_achievements,
        "next_token": None
    }

    # Add next_token if there are more items to fetch
    if "LastEvaluatedKey" in response:
        next_token = json.dumps(response["LastEvaluatedKey"], cls=DecimalEncoder)
        result["next_token"] = next_token
        logger.debug(f"Next token generated: {next_token}")

    return build_response(
        200,
        {
            "message": "Achievements fetched successfully",
            "data": result
        }
    )


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)