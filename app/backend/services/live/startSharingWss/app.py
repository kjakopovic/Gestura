import logging
import os
import json

from boto3 import client
from botocore.exceptions import ClientError

logger = logging.getLogger("OnDisconnectWss")
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

    room_id = request_body.get("roomId")
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

    room = get_room_by_id(chatRoomDb, room_id)
    if not room:
        logger.error("Room not found.")
        return {"statusCode": 400, "body": "Room not found."}

    user_connections: dict = room.get("user_connections", {})
    peer_id = user_connections.get(connection_id, "")

    for other_conn_id in user_connections.keys():
        if other_conn_id == connection_id:
            continue

        try:
            logger.info(f"Sending message to {other_conn_id}")
            ws.post_to_connection(
                ConnectionId=other_conn_id,
                Data=json.dumps(
                    {"action": "user-started-sharing", "peerId": peer_id}
                ).encode("utf-8"),
            )
        except ClientError as e:
            code = e.response["Error"]["Code"]
            if code == "GoneException":
                logger.info(f"Stale connection, skipping: {other_conn_id}")
            else:
                logger.error(f"Error posting to {other_conn_id}: {e}")

    return {"statusCode": 200, "body": "screen shared"}


def get_room_by_id(dynamodb, id):
    room = dynamodb.table.get_item(Key={"chat_id": id})

    return room.get("Item")
