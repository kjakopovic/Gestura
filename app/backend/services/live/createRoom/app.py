from uuid import uuid4

from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_CHAT_ROOM_TABLE_RESOURCE,
    _LAMBDA_CONNECTIONS_TABLE_RESOURCE,
)
from auth import get_email_from_jwt_token
from middleware import middleware
from common import build_response


@middleware
def lambda_handler(event, context):
    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        return build_response(400, {"message": "Invalid email in jwt token"})

    global _LAMBDA_CHAT_ROOM_TABLE_RESOURCE, _LAMBDA_CONNECTIONS_TABLE_RESOURCE
    chatRoomDb = LambdaDynamoDBClass(_LAMBDA_CHAT_ROOM_TABLE_RESOURCE)
    connectionsDb = LambdaDynamoDBClass(_LAMBDA_CONNECTIONS_TABLE_RESOURCE)

    user = get_user_connection_by_email(connectionsDb, email)
    if not user or not user.get("connection_id"):
        return build_response(400, {"message": "User connection not found"})

    room_id = str(uuid4())
    chatRoomDb.put_item(Item={"chat_id": room_id, "users": [user.get("connection_id")]})

    return build_response(
        200,
        {
            "message": "Chat room created successfully",
            "room_id": room_id,
        },
    )


def get_user_connection_by_email(dynamodb, email):
    user = dynamodb.table.get_item(Key={"email": email})

    return user.get("Item")
