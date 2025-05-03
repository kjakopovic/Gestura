import logging
import json
import os
from boto3 import client
from botocore.exceptions import ClientError

from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_CHAT_ROOM_TABLE_RESOURCE,
)

logger = logging.getLogger("JoinRoomWss")
logger.setLevel(logging.DEBUG)


def lambda_handler(event, context):
    logger.debug(f"Received event: {event}")

    body = event.get("body")
    if body is not None:
        request_body = json.loads(body)
    else:
        request_body = event

    room_id = request_body.get("roomId")
    if not room_id:
        logger.error("Room ID not found in request body.")
        return {"statusCode": 400, "body": "Room ID not found."}

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

    room = update_room(chatRoomDb, room_id, connection_id, peer_id)
    if not room:
        logger.error("Room not found")
        return {"statusCode": 400, "body": "Room not found."}

    # 1) Notify everyone else in the room that you joined
    user_connections: dict = room.get("user_connections", {})

    for other_conn_id in user_connections.keys():
        # skip the socket that just joined
        if other_conn_id == connection_id:
            continue

        try:
            ws.post_to_connection(
                ConnectionId=other_conn_id,
                Data=json.dumps({"action": "user-joined", "peerId": peer_id}).encode(
                    "utf-8"
                ),
            )
        except ClientError as e:
            logger.info(f"Skipping stale connection {other_conn_id}: {e}")

    # 2) Send the full list of users back to the joining socket
    user_list = list(user_connections.values())
    try:
        ws.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(
                {"action": "get-users", "roomId": room_id, "users": user_list}
            ).encode("utf-8"),
        )
    except ClientError as e:
        logger.error(f"Failed to send user list back: {e}")

    return {"statusCode": 200, "body": "Room joined."}


def update_room(db, room_id, connection_id, peer_id):
    """
    Adds or replaces the mapping connection_id → peer_id
    inside the user_connections map on the given chat room item.
    """
    resp = db.table.update_item(
        Key={"chat_id": room_id},
        UpdateExpression="SET user_connections.#conn = :peer",
        ExpressionAttributeNames={"#conn": connection_id},
        ExpressionAttributeValues={":peer": peer_id},
        ReturnValues="ALL_NEW",
    )

    return resp["Attributes"]
