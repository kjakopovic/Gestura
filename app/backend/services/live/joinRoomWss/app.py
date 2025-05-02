import logging
import json

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
    connection_id = event["requestContext"]["connectionId"]

    if not connection_id:
        logger.error("Connection ID not found in event.")
        return {"statusCode": 400, "body": "Connection ID not found."}

    logger.info("Setting up db connections")
    global _LAMBDA_CHAT_ROOM_TABLE_RESOURCE
    chatRoomDb = LambdaDynamoDBClass(_LAMBDA_CHAT_ROOM_TABLE_RESOURCE)

    room = update_room(chatRoomDb, room_id, connection_id)
    if not room:
        logger.error("Room not found")
        return {"statusCode": 400, "body": "Room not found."}

    return {"statusCode": 200, "body": "Room joined."}


def update_room(dynamodb, id, user_conn):
    resp = dynamodb.table.update_item(
        Key={"chat_id": id},
        UpdateExpression="ADD user_connections :new_conn",
        ExpressionAttributeValues={":new_conn": {user_conn}},
        ReturnValues="ALL_NEW",
    )
    return resp["Attributes"]
