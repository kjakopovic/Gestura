import os, json
import boto3

# TODO: needs some reworking

dynamodb = boto3.resource("dynamodb")
chat_rooms = dynamodb.Table(os.environ["CHAT_ROOM_TABLE"])


def lambda_handler(event, context):
    room_id = event["pathParameters"]["roomId"]
    body = json.loads(event.get("body", "{}"))
    peer_id = body.get("peerId")
    chat_rooms.update_item(
        Key={"chat_id": room_id},
        UpdateExpression="ADD users :u",
        ExpressionAttributeValues={":u": set([peer_id])},
    )
    room = chat_rooms.get_item(Key={"chat_id": room_id}).get("Item", {})
    users = room.get("users", [])
    return {
        "statusCode": 200,
        "body": json.dumps({"roomId": room_id, "users": users}),
        "headers": {"Content-Type": "application/json"},
    }
