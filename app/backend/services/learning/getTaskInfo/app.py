import json
import logging

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response
from boto import LambdaDynamoDBClass, _LAMBDA_TASKS_TABLE_RESOURCE
from middleware import middleware

logger = logging.getLogger("GetTaskInfo")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    taskId: str


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    body = event.get("body")
    if body is not None:
        request_body = json.loads(body)
    else:
        request_body = event

    try:
        logger.debug(f"Validating request {request_body}")
        validate(event=request_body, schema=schema)
    except SchemaValidationError as e:
        logger.error(f"Validation failed: {e}")
        return build_response(400, {"message": str(e)})

    logger.info("Parsing request body")
    request = Request(**request_body)

    global _LAMBDA_TASKS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_TASKS_TABLE_RESOURCE)

    return get_task_info(dynamodb, request.taskId)


def get_task_info(dynamodb, taskId):
    logger.info(f"Getting task {taskId}")

    response = dynamodb.table.get_item(
        Key={
            "taskId": taskId
        }
    )

    return build_response(
        200,
        {
            "taskInfo": response.get("Item", {})
        }
    )