import logging

from common import build_response
from boto import LambdaDynamoDBClass, _LAMBDA_TASKS_TABLE_RESOURCE
from middleware import middleware

logger = logging.getLogger("GetTaskInfo")
logger.setLevel(logging.DEBUG)


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    task_id = event.get("pathParameters", {}).get("taskId")
    if not task_id:
        logger.error(f"No taskId provided in path parameters, request event: {event}")
        return build_response(
            400,
            {
                "message": "No taskId provided in path parameters"
            }
        )

    global _LAMBDA_TASKS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_TASKS_TABLE_RESOURCE)

    return get_task_info(dynamodb, task_id)


def get_task_info(dynamodb, taskId):
    logger.info(f"Getting task {taskId}")

    response = dynamodb.table.get_item(
        Key={
            "taskId": taskId
        }
    )

    if "Item" not in response:
        logger.error(f"Task with id {taskId} not found")
        return build_response(
            404,
            {
                "message": "Task not found"
            }
        )

    return build_response(
        200,
        {
            "taskInfo": response.get("Item", {})
        }
    )