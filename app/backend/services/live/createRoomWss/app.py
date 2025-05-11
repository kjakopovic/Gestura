import logging
import os
import json
from uuid import uuid4

from boto3 import client

logger = logging.getLogger("CreateRoomWss")
logger.setLevel(logging.DEBUG)

from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_CHAT_ROOM_TABLE_RESOURCE,
)


def lambda_handler(event, context):
    logger.debug(f"Received event: {event}")

    body = event.get("body")
    if body is not None:
        request_body = json.loads(body)
    else:
        request_body = event

    peer_id = request_body.get("peerId")
    if not peer_id:
        logger.error("Peer ID not found in request body.")
        return {"statusCode": 400, "body": "Peer ID not found."}

    connection_id = event["requestContext"]["connectionId"]
    if not connection_id:
        logger.error("Connection ID not found in event.")
        return {"statusCode": 400, "body": "Connection ID not found."}

    logger.info("Setting up db connections")
    global _LAMBDA_CHAT_ROOM_TABLE_RESOURCE
    chatRoomDb = LambdaDynamoDBClass(_LAMBDA_CHAT_ROOM_TABLE_RESOURCE)

    raw = os.environ["WEBSOCKET_ENDPOINT"]
    https_url = raw.replace("wss://", "https://", 1)
    ws = client("apigatewaymanagementapi", endpoint_url=https_url)

    logger.debug(f"User connection: {connection_id}")
    room_id = create_room(chatRoomDb, connection_id, peer_id)

    logger.info(f"Sending message to {connection_id}")
    ws.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps({"action": "room-created", "roomId": room_id}).encode("utf-8"),
    )

    return {"statusCode": 200, "body": "room created"}


def create_room(db, connection_id, peer_id):
    room_id = str(uuid4())
    logger.debug(f"Creating chat room with ID: {room_id}")

    user_connections = {connection_id: peer_id}

    db.table.put_item(
        Item={
            "chat_id": room_id,
            "user_connections": user_connections,
        }
    )

    return room_id
