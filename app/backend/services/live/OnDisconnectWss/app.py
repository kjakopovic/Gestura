import logging

from boto3.dynamodb.conditions import Key

logger = logging.getLogger("OnDisconnectWss")
logger.setLevel(logging.INFO)

from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_CONNECTIONS_TABLE_RESOURCE,
)


def lambda_handler(event, context):
    connection_id = event.get("requestContext").get("connectionId")

    if not connection_id:
        return {"statusCode": 400, "body": "Connection ID not found."}

    # Getting dynamodb table connection
    global _LAMBDA_CONNECTIONS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_CONNECTIONS_TABLE_RESOURCE)

    logger.info("Deleting connection from user.")

    connection = query_connections_by_id(dynamodb, connection_id)

    if connection:
        delete_connection(dynamodb, connection[0].get("email"))

    logger.info("Successfully disconnected.")

    return {"statusCode": 200, "body": "Disconnected."}


def query_connections_by_id(dynamodb, connection_id):
    return dynamodb.table.query(
        IndexName="ConnectionIdIndex",
        KeyConditionExpression=Key("connection_id").eq(connection_id),
    ).get("Items")


def delete_connection(dynamodb, email):
    dynamodb.table.delete_item(Key={"email": email})
