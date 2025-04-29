import boto3
import logging
import uuid
import json
from datetime import datetime, timezone

from botocore.exceptions import ClientError

logger = logging.getLogger("SendMessageWss")
logger.setLevel(logging.INFO)

from common.common import (
    _LAMBDA_CONNECTIONS_TABLE_RESOURCE,
    _LAMBDA_CHAT_ROOM_TABLE_RESOURCE,
    _LAMBDA_MESSAGE_HISTORY_TABLE_RESOURCE,
    LambdaDynamoDBClass,
    build_response,
)

# TODO: need to rework for our logic


def lambda_handler(event, context):
    body = event.get("body") if "body" in event else event

    logger.info(f"Checking required data from request body: {body}")

    try:
        if isinstance(body, str):
            body = json.loads(body)

        message = body["message"]
        chat_id = body["chat_id"]
        email = body["sent_from"]
    except Exception as e:
        logger.error(f"{e} is missing, please check and try again.")

        return build_response(
            400, {"message": f"{e} is missing, please check and try again"}
        )

    # Getting dynamodb table connection
    global _LAMBDA_CONNECTIONS_TABLE_RESOURCE
    dynamodb_connections = LambdaDynamoDBClass(_LAMBDA_CONNECTIONS_TABLE_RESOURCE)

    global _LAMBDA_CHAT_ROOM_TABLE_RESOURCE
    dynamodb_chat_rooms = LambdaDynamoDBClass(_LAMBDA_CHAT_ROOM_TABLE_RESOURCE)

    global _LAMBDA_MESSAGE_HISTORY_TABLE_RESOURCE
    dynamodb_message_history = LambdaDynamoDBClass(
        _LAMBDA_MESSAGE_HISTORY_TABLE_RESOURCE
    )

    try:
        logger.info("Getting chat room data.")

        chat_data = dynamodb_chat_rooms.table.get_item(Key={"chat_id": chat_id})

        if not chat_data.get("Item"):
            logger.warning("Chat room not found.")

            return build_response(400, {"message": "Chat room not found."})

        logger.info("Initializing web socket connection.")

        apigw_management_api = boto3.client(
            "apigatewaymanagementapi",
            endpoint_url=f"https://{event['requestContext']['domainName']}/{event['requestContext']['stage']}",
        )

        logger.info("Getting all users from a chat room.")

        connections_in_chat_room = chat_data.get("Item").get("connections")

        for connection in connections_in_chat_room:
            if connection != email:
                logger.info(f"Found user that is not the sender: {connection}.")

                user = dynamodb_connections.table.get_item(
                    Key={"email": connection}
                ).get("Item")

                logger.info("Saving message to history.")

                dynamodb_message_history.table.put_item(
                    Item={
                        "message_id": str(uuid.uuid4()),
                        "sent_from": email,
                        "send_to": connection,
                        "message": message,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "chat_id": chat_id,
                    }
                )

                if not user or not user.get("connection_id"):
                    logger.warning(f"User {connection} does not have connection id.")
                    return build_response(
                        200,
                        {"message": f"User {connection} does not have connection id."},
                    )

                logger.info("Found connection id.")

                send_to_id = user.get("connection_id")

                logger.info("Sending message to connection.")

                if apigw_management_api:
                    apigw_management_api.post_to_connection(
                        ConnectionId=send_to_id, Data=message.encode("utf-8")
                    )
    except Exception as e:
        if e is ClientError and e.response["Error"]["Code"] == "GoneException":
            logger.warning(f"Found stale connection, deleting {send_to_id}")

            try:
                dynamodb_connections.table.delete_item(Key={"email": connection})
            except Exception as delete_error:
                logger.error("Failed to delete connection: " + str(delete_error))

                return build_response(500, {"message": str(delete_error)})
        else:
            logger.error("Failed to send message: " + str(e))

            return build_response(500, {"message": str(e)})

    return {"statusCode": 200, "body": "Message sent."}
