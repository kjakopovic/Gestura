import logging
import os

from boto3 import client
from boto3.dynamodb.conditions import Key

logger = logging.getLogger("OnDisconnectWss")
logger.setLevel(logging.INFO)

from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_CONNECTIONS_TABLE_RESOURCE,
)


def lambda_handler(event, context):
    connection_id = event.get("requestContext").get("connectionId")

    if not connection_id:
        return {"statusCode": 400, "body": "Connection ID not found."}

    # Getting dynamodb table connection
    global _LAMBDA_CONNECTIONS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_CONNECTIONS_TABLE_RESOURCE)
    ws = client(
        "apigatewaymanagementapi", endpoint_url=os.environ["WEBSOCKET_ENDPOINT"]
    )

    logger.info("Deleting connection from user.")

    connection = query_connections_by_id(dynamodb, connection_id)

    if connection:
        delete_connection(dynamodb, connection[0].get("email"))

    # TODO: Remove peer from any rooms he is inside (probably wont need this logic above for deleting from a global connections table)
    # 3) Remove from any rooms & notify others
    # rooms = chat_rooms.scan().get("Items", [])
    # for room in rooms:
    #     users = room.get("users", [])
    #     if peer_id in users:
    #         # remove
    #         chat_rooms.update_item(
    #             Key={"chat_id": room["chat_id"]},
    #             UpdateExpression="DELETE users :u",
    #             ExpressionAttributeValues={":u": set([peer_id])},
    #         )
    #         # notify remaining
    #         for other in users:
    #             if other == peer_id:
    #                 continue
    #             rec = connections.get_item(Key={"email": other})
    #             if "Item" in rec:
    #                 ws.post_to_connection(
    #                     ConnectionId=rec["Item"]["connection_id"],
    #                     Data=json.dumps(
    #                         {"action": "user-disconnected", "peerId": peer_id}
    #                     ).encode("utf-8"),
    #                 )

    logger.info("Successfully disconnected.")

    return {"statusCode": 200, "body": "Disconnected."}


def query_connections_by_id(dynamodb, connection_id):
    return dynamodb.table.query(
        IndexName="ConnectionIdIndex",
        KeyConditionExpression=Key("connection_id").eq(connection_id),
    ).get("Items")


def delete_connection(dynamodb, email):
    dynamodb.table.delete_item(Key={"email": email})
