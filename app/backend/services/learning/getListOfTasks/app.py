import json
import logging
import random

from moto.dynamodb.parsing.ast_nodes import ExpressionAttributeValue

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
    level: int


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

    # Number of tasks to return
    limit_of_tasks = 10

    # Every 10 levels = 1 section
    # 0-9 = section 10, 10-19 = section 20, etc.
    section = (request.level // 10 + 1) * 10

    return get_list_of_tasks(dynamodb, section, limit_of_tasks)


def get_list_of_tasks(dynamodb, section, limit_of_tasks):
    logger.info(f"Getting list of tasks for section {section}")

    tasks = get_tasks_for_section(dynamodb, section)

    current_section = section
    while len(tasks) < limit_of_tasks and current_section > 10:
        current_section -= 10
        logger.info(f"Not enough tasks, getting tasks from previous section {current_section}")

        previous_tasks = get_tasks_for_section(dynamodb, current_section)
        tasks.extend(previous_tasks)

        if len(tasks) > limit_of_tasks:
            break

    random.shuffle(tasks)
    tasks = tasks[:limit_of_tasks]

    return build_response(
        200,
        {
            "message": "Tasks fetched successfully",
            "tasks": tasks
        }
    )


def get_tasks_for_section(dynamodb, section):
    logger.info(f"Getting tasks for section {section}")

    response = dynamodb.table.query(
        IndexName="section-index",
        FilterExpression="section = :section",
        ExpressionAttributeValues={
            ":section": section
        }
    )

    return response.get("Items", [])
