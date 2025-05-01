import logging

from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_CHAT_ROOM_TABLE_RESOURCE,
    _LAMBDA_CONNECTIONS_TABLE_RESOURCE,
)
from auth import get_email_from_jwt_token
from middleware import middleware
from common import build_response

logger = logging.getLogger("JoinRoom")
logger.setLevel(logging.DEBUG)


@middleware
def lambda_handler(event, context):
    logger.debug(f"Event: {event}")
    room_id = event["pathParameters"]["room_id"]

    logger.debug(f"Room ID: {room_id}")
    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error("Invalid email in jwt token")
        return build_response(400, {"message": "Invalid email in jwt token"})

    logger.info("Setting up db connections")
    global _LAMBDA_CHAT_ROOM_TABLE_RESOURCE, _LAMBDA_CONNECTIONS_TABLE_RESOURCE
    chatRoomDb = LambdaDynamoDBClass(_LAMBDA_CHAT_ROOM_TABLE_RESOURCE)
    connectionsDb = LambdaDynamoDBClass(_LAMBDA_CONNECTIONS_TABLE_RESOURCE)

    logger.debug("Getting user connection by email")
    user = get_user_connection_by_email(connectionsDb, email)
    if not user or not user.get("connection_id"):
        return build_response(400, {"message": "User connection not found"})

    logger.debug(f"User connection: {user}")
    room = update_room(chatRoomDb, room_id, user.get("connection_id"))
    if not room:
        logger.error("Room not found")
        return build_response(400, {"message": "Room not found"})

    return build_response(
        200,
        {
            "message": "User added to room successfully",
            "room": room,
        },
    )


def get_user_connection_by_email(dynamodb, email):
    user = dynamodb.table.get_item(Key={"email": email})

    return user.get("Item")


def update_room(dynamodb, id, user):
    room = dynamodb.table.update_item(
        Key={"chat_id": id},
        UpdateExpression="ADD users :u",
        ExpressionAttributeValues={":u": set([user])},
    )

    return room.get("Item")
