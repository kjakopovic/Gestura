import logging
import os
import json

from boto3 import client
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

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
        room_id = room["chat_id"]
        user_conns: dict = room.get("user_connections", {})
        conn_ids = list(user_conns.keys())

        logger.debug(f"Room {room_id} has connections: {conn_ids}")

        # if this connection isn't here, skip
        if connection_id not in conn_ids:
            continue

        # get current connection peer id
        peer_id = user_conns.get(connection_id, "")

        # if it was the only one, delete the room
        if len(conn_ids) <= 1:
            logger.info(f"No other users in room {room_id}; deleting room.")
            chatRoomDb.table.delete_item(Key={"chat_id": room_id})
            continue

        # remove this connection from the map
        logger.info(f"Removing connection {connection_id} from room {room_id}")
        resp = chatRoomDb.table.update_item(
            Key={"chat_id": room_id},
            UpdateExpression="REMOVE user_connections.#conn",
            ExpressionAttributeNames={"#conn": connection_id},
            ReturnValues="ALL_NEW",
        )

        updated_conns: dict = resp["Attributes"].get("user_connections", {})
        remaining_ids = list(updated_conns.keys())
        logger.info(f"Room {room_id} now has connections: {remaining_ids}")

        # notify everyone else that this peer disconnected
        for other_conn in remaining_ids:
            try:
                ws.post_to_connection(
                    ConnectionId=other_conn,
                    Data=json.dumps(
                        {"action": "user-disconnected", "peerId": peer_id}
                    ).encode("utf-8"),
                )
            except ClientError as e:
                logger.info(f"Skipping stale connection {other_conn}: {e}")

    logger.info("Successfully disconnected.")

    return {"statusCode": 200, "body": "Disconnected."}


def query_connections_by_id(dynamodb, connection_id):
    return dynamodb.table.query(
        IndexName="ConnectionIdIndex",
        KeyConditionExpression=Key("connection_id").eq(connection_id),
    ).get("Items")


def delete_connection(dynamodb, email):
    dynamodb.table.delete_item(Key={"email": email})
