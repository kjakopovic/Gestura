import logging
import os
import json

from boto3 import client
from boto3.dynamodb.conditions import Key

logger = logging.getLogger("OnDisconnectWss")
logger.setLevel(logging.DEBUG)

from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_CONNECTIONS_TABLE_RESOURCE,
    _LAMBDA_CHAT_ROOM_TABLE_RESOURCE,
)


def lambda_handler(event, context):
    connection_id = event.get("requestContext").get("connectionId")

    if not connection_id:
        logger.error("Connection ID not found in event.")
        return {"statusCode": 400, "body": "Connection ID not found."}

    # Getting dynamodb table connection
    global _LAMBDA_CONNECTIONS_TABLE_RESOURCE
    global _LAMBDA_CHAT_ROOM_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_CONNECTIONS_TABLE_RESOURCE)
    chatRoomDb = LambdaDynamoDBClass(_LAMBDA_CHAT_ROOM_TABLE_RESOURCE)

    logger.info("Setting up db connections")
    raw = os.environ["WEBSOCKET_ENDPOINT"]
    https_url = raw.replace("wss://", "https://", 1)
    ws = client("apigatewaymanagementapi", endpoint_url=https_url)

    logger.info("Deleting connection from user.")

    connections = query_connections_by_id(dynamodb, connection_id)

    if connections:
        logger.info(f"Deleting connection: {connections[0]}")
        delete_connection(dynamodb, connections[0].get("email"))

    rooms = chatRoomDb.table.scan().get("Items", [])
    logger.info(f"Rooms: {rooms}")
    for room in rooms:
        users = room.get("user_connections", [])
        logger.info(f"{room} - Users: {users}")
        if connection_id in users:
            logger.info(
                f"Removing connection {connection_id} from room {room['chat_id']}"
            )
            # remove
            chatRoomDb.table.update_item(
                Key={"chat_id": room["chat_id"]},
                UpdateExpression="DELETE user_connections :u",
                ExpressionAttributeValues={":u": {connection_id}},
                ReturnValues="ALL_NEW",
            )

            # notify remaining
            for other in users:
                logger.info(f"Notifying {other} about disconnection.")

                if other == connection_id:
                    continue

                ws.post_to_connection(
                    ConnectionId=other,
                    Data=json.dumps(
                        {"action": "user-disconnected", "peerId": connection_id}
                    ).encode("utf-8"),
                )

    logger.info("Successfully disconnected.")

    return {"statusCode": 200, "body": "Disconnected."}


def query_connections_by_id(dynamodb, connection_id):
    return dynamodb.table.query(
        IndexName="ConnectionIdIndex",
        KeyConditionExpression=Key("connection_id").eq(connection_id),
    ).get("Items")


def delete_connection(dynamodb, email):
    dynamodb.table.delete_item(Key={"email": email})
