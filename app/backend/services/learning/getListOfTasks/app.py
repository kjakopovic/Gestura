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

    # Every 10 levels = 1 section
    # 0-9 = section 10, 10-19 = section 20, etc.
    section = (request.level // 10 + 1) * 10

    return get_list_of_tasks(dynamodb, section)


def get_list_of_tasks(dynamodb, section):
    logger.info(f"Getting list of tasks for section {section}")

    tasks = get_tasks_for_section(dynamodb, section)
    selected_tasks = chose_tasks(tasks, 4, 4, 2)

    if section == 10:
        selected_tasks.append(random.choice(tasks))
    if section == 20:
        tasks = get_tasks_for_section(dynamodb, 10)
        prev_section_tasks = chose_tasks(tasks, 2, 2, 1)
        selected_tasks.extend(prev_section_tasks)
    else:
        prev_tasks_1 = get_tasks_for_section(dynamodb, section - 10)
        prev_tasks_2 = get_tasks_for_section(dynamodb, section - 20)

        prev_section_tasks_1 = chose_tasks(prev_tasks_1, 1, 1, 1)
        prev_section_tasks_2 = chose_tasks(prev_tasks_2, 1, 1, 0)

        selected_tasks.extend(prev_section_tasks_1)
        selected_tasks.extend(prev_section_tasks_2)

    return build_response(
        200,
        {
            "message": "Tasks fetched successfully",
            "tasks": selected_tasks
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


def chose_tasks(tasks, num_v1, num_v2, num_v3):
    tasks_by_version = {1: [], 2: [], 3: []}

    for task in tasks:
        version = task.get("version")
        if version in tasks_by_version:
            tasks_by_version[version].append(task)

    # Shuffle tasks by version
    for version in tasks_by_version:
        random.shuffle(tasks_by_version[version])

    # Take required number from each version
    chosen_tasks = []
    chosen_tasks.extend(tasks_by_version[1][:num_v1])
    chosen_tasks.extend(tasks_by_version[2][:num_v2])
    chosen_tasks.extend(tasks_by_version[3][:num_v3])

    random.shuffle(chosen_tasks)

    return chosen_tasks