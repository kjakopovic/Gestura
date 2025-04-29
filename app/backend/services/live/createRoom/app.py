import os, json
import boto3
from uuid import uuid4

# TODO: needs some reworking

dynamodb = boto3.resource("dynamodb")
chat_rooms = dynamodb.Table(os.environ["CHAT_ROOM_TABLE"])


def lambda_handler(event, context):
    room_id = str(uuid4())
    chat_rooms.put_item(Item={"chat_id": room_id, "users": []})
    return {
        "statusCode": 201,
        "body": json.dumps({"roomId": room_id}),
        "headers": {"Content-Type": "application/json"},
    }
