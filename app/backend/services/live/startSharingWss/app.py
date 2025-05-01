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
    body = json.loads(event.get("body", "{}"))
    room_id = body.get("roomId")
    connection_id = event["requestContext"]["connectionId"]

    if not connection_id:
        return {"statusCode": 400, "body": "Connection ID not found."}

    global _LAMBDA_CHAT_ROOM_TABLE_RESOURCE
    chatRoomDb = LambdaDynamoDBClass(_LAMBDA_CHAT_ROOM_TABLE_RESOURCE)

    ws = client(
        "apigatewaymanagementapi", endpoint_url=os.environ["WEBSOCKET_ENDPOINT"]
    )

    room = get_room_by_id(chatRoomDb, room_id)
    if not room:
        return {"statusCode": 400, "body": "Room not found."}

    for user in room.get("users", []):
        if user == connection_id:
            continue

        try:
            ws.post_to_connection(
                ConnectionId=user,
                Data=json.dumps(
                    {"action": "user-started-sharing", "peerId": connection_id}
                ).encode("utf-8"),
            )
        except ClientError as e:
            code = e.response["Error"]["Code"]
            if code == "GoneException":
                logger.info(f"Stale connection, skipping: {user}")
            else:
                logger.error(f"Error posting to {user}: {e}")

    return {"statusCode": 200, "body": "screen shared"}


def get_room_by_id(dynamodb, id):
    room = dynamodb.table.get_item(Key={"chat_id": id})

    return room.get("Item")
