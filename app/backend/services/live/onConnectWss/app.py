import logging
import traceback

logger = logging.getLogger("OnConnectWss")
logger.setLevel(logging.INFO)

from auth import get_email_from_jwt_token
from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_CONNECTIONS_TABLE_RESOURCE,
)


def lambda_handler(event, context):
    try:
        # Getting JWT token from query parameters
        jwt_token = event.get("queryStringParameters", {}).get("x-access-token")
        if not jwt_token:
            logger.error("JWT token not found in query parameters.")
            return {"statusCode": 400, "body": "Authorization token is missing."}

        # Extract email from JWT token
        email = get_email_from_jwt_token(jwt_token)
        if not email:
            logger.error("Failed to extract email from JWT token.")
            return {"statusCode": 400, "body": "Invalid authorization token."}

        # Initialize DynamoDB connection
        dynamodb = LambdaDynamoDBClass(_LAMBDA_CONNECTIONS_TABLE_RESOURCE)
        if not dynamodb.table:
            logger.error("DynamoDB table resource is not initialized.")
            return {"statusCode": 500, "body": "Internal server error."}

        logger.info("Inserting connection into database.")

        # Insert connection details into DynamoDB
        dynamodb.table.put_item(
            Item={
                "email": email,
                "connection_id": event["requestContext"]["connectionId"],
            }
        )

        logger.info("Successfully connected.")
        return {"statusCode": 200, "body": "Connected."}

    except Exception as e:
        logger.error("An unexpected error occurred: %s", str(e))
        logger.debug(traceback.format_exc())

        return {
            "statusCode": 500,
            "body": f"An internal server error occurred: {str(e)}",
        }
