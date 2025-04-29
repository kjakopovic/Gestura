import os
import json
import boto3
from uuid import uuid4

# TODO: needs rework and checking of the logic

dynamodb = boto3.resource("dynamodb")
connections = dynamodb.Table(os.environ["CONNECTIONS_TABLE"])
chat_rooms = dynamodb.Table(os.environ["CHAT_ROOM_TABLE"])
ws = boto3.client(
    "apigatewaymanagementapi", endpoint_url=os.environ["WEBSOCKET_ENDPOINT"]
)


def handler(event, context):
    body = json.loads(event.get("body", "{}"))
    action = body.get("action")
    room_id = body.get("roomId")
    peer_id = body.get("peerId")
    conn_id = event["requestContext"]["connectionId"]

    if action == "create-room":
        new_room = str(uuid4())
        chat_rooms.put_item(Item={"chat_id": new_room, "users": []})
        ws.post_to_connection(
            ConnectionId=conn_id,
            Data=json.dumps({"action": "room-created", "roomId": new_room}).encode(
                "utf-8"
            ),
        )

    elif action == "join-room":
        # map peerId→connId
        connections.put_item(Item={"email": peer_id, "connection_id": conn_id})
        # add to room
        chat_rooms.update_item(
            Key={"chat_id": room_id},
            UpdateExpression="ADD users :u",
            ExpressionAttributeValues={":u": set([peer_id])},
        )
        # fetch updated list
        room = chat_rooms.get_item(Key={"chat_id": room_id}).get("Item", {})
        users = room.get("users", [])
        # tell joiner
        ws.post_to_connection(
            ConnectionId=conn_id,
            Data=json.dumps(
                {"action": "get-users", "roomId": room_id, "users": users}
            ).encode("utf-8"),
        )
        # tell others
        for other in users:
            if other == peer_id:
                continue
            rec = connections.get_item(Key={"email": other})
            if "Item" in rec:
                ws.post_to_connection(
                    ConnectionId=rec["Item"]["connection_id"],
                    Data=json.dumps(
                        {"action": "user-joined", "peerId": peer_id}
                    ).encode("utf-8"),
                )

    elif action in ("start-sharing", "stop-sharing"):
        evt = (
            "user-started-sharing"
            if action == "start-sharing"
            else "user-stopped-sharing"
        )
        room = chat_rooms.get_item(Key={"chat_id": room_id}).get("Item", {})
        users = room.get("users", [])
        for other in users:
            if other == peer_id:
                continue
            rec = connections.get_item(Key={"email": other})
            if "Item" in rec:
                ws.post_to_connection(
                    ConnectionId=rec["Item"]["connection_id"],
                    Data=json.dumps({"action": evt, "peerId": peer_id}).encode("utf-8"),
                )

    return {"statusCode": 200}
