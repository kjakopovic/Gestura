import json
import logging

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response
from boto import LambdaDynamoDBClass, _LAMBDA_TASKS_TABLE_RESOURCE
from middleware import middleware

logger = logging.getLogger("GetListOfTasks")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    taskId: int


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

    limit_of_tasks = 10

    return get_list_of_tasks(dynamodb, request.taskId, limit_of_tasks)


def get_list_of_tasks(dynamodb, taskId, limit_of_tasks):
    logger.info(f"Getting list of tasks from {taskId} to {taskId + limit_of_tasks}")

    response = dynamodb.table.query(
        KeyConditionExpression="taskId BETWEEN :start_id AND :end_id",
        ExpressionAttributeValues={
            ":start_id": int(taskId),
            ":end_id": int(taskId) + limit_of_tasks,
        },
        ProjectionExpression="taskId, question"
    )

    list_of_tasks = response["Items"]

    return build_response(
        200,
        {
            "message": "Successfully fetched tasks",
            "tasks": list_of_tasks
        }
    )

