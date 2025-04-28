import logging
import random
import decimal

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response, convert_decimal_to_float
from boto import LambdaDynamoDBClass, _LAMBDA_TASKS_TABLE_RESOURCE
from middleware import middleware
from boto3.dynamodb.conditions import Key

logger = logging.getLogger("GetListOfTasks")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    level: int


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    query_params = event.get("queryStringParameters", {})
    try:
        logger.debug(f"Validating query params: {query_params}")

        validate(event=query_params, schema=schema)
    except SchemaValidationError as e:
        logger.error(f"Validation failed: {e}")
        return build_response(400, {"message": str(e)})

    global _LAMBDA_TASKS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_TASKS_TABLE_RESOURCE)

    # Every 10 levels = 1 section
    # 0-9 = section 10, 10-19 = section 20, etc.
    level = int(query_params.get("level", 1))
    section = (level // 10 + 1) * 10

    return get_list_of_tasks(dynamodb, section)


def get_list_of_tasks(dynamodb, section):
    logger.info(f"Getting list of tasks for section {section}")

    tasks = get_tasks_for_section(dynamodb, section)
    selected_tasks = chose_tasks(tasks, 4, 4, 2)

    if len(tasks) <= 0:
        logger.error("No tasks found for section")
        return build_response(404, {"message": "No tasks found", "tasks": []})

    if section == 10:
        for i in range(5):
            selected_tasks.append(random.choice(tasks))
    elif section == 20:
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

    # Convert Decimal to float for JSON serialization
    selected_tasks = convert_decimal_to_float(selected_tasks)

    return build_response(
        200, {"message": "Tasks fetched successfully", "tasks": selected_tasks}
    )


def get_tasks_for_section(dynamodb, section):
    logger.info(f"Getting tasks for section {section}")

    response = dynamodb.table.query(
        IndexName="section-index", KeyConditionExpression=Key("section").eq(section)
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
