import logging
import random
import os

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response, convert_decimal_to_float
from boto import LambdaDynamoDBClass, _LAMBDA_TASKS_TABLE_RESOURCE, _LAMBDA_USERS_TABLE_RESOURCE
from middleware import middleware
from boto3.dynamodb.conditions import Key
from auth import get_email_from_jwt_token

logger = logging.getLogger("GetListOfTasks")
logger.setLevel(logging.DEBUG)

CURRENT_MAX_SECTION = int(os.environ.get('CURRENT_MAX_SECTION', 10))

@dataclass
class Request:
    level: int


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    query_params = event.get("queryStringParameters", {})
    try:
        logger.debug(f"Validating query params: {query_params}")

        validate(event=query_params, schema=schema)
    except SchemaValidationError as e:
        logger.error(f"Validation failed: {e}")
        return build_response(400, {"message": str(e)})

    global _LAMBDA_TASKS_TABLE_RESOURCE, _LAMBDA_USERS_TABLE_RESOURCE
    tasks_dynamodb = LambdaDynamoDBClass(_LAMBDA_TASKS_TABLE_RESOURCE)
    user_dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

    users_current_level = get_users_current_level(user_dynamodb, email)
    if users_current_level is None:
        logger.error(f"User {email} not found in the database.")
        return build_response(404, {"message": "User not found"})

    # Every 10 levels = 1 section
    # 0-9 = section 10, 10-19 = section 20, etc.
    level = int(query_params.get("level", 1))
    section = (level // 10 + 1) * 10

    if users_current_level + 1 == level:
        return get_list_of_tasks(tasks_dynamodb, section)
    else:
        logger.error(f"User {email} is not allowed to access level {level}.")
        return build_response(
            403,
            {
                "message": f"User {email} is not allowed to access level {level}.",
                "current_level": users_current_level,
            },
        )


def get_list_of_tasks(dynamodb, section):
    logger.info(f"Getting list of tasks for section {section}")

    tasks = get_tasks_for_section(dynamodb, section)
    selected_tasks = []
    section_exists = True

    if len(tasks) <= 0:
        logger.error(f"No tasks found for section: {section}. Getting random tasks.")

        if CURRENT_MAX_SECTION == 0:
            logger.error("No tasks found in the database.")
            return build_response(404, {"message": "No tasks found", "tasks": []})

        if CURRENT_MAX_SECTION + 10 == section:
            logger.info(f"Creating random tasks for section {section} from previous sections")
            tasks_1 = get_tasks_for_section(dynamodb, CURRENT_MAX_SECTION)
            tasks_2 = get_tasks_for_section(dynamodb, CURRENT_MAX_SECTION - 10)
            tasks_3 = get_tasks_for_section(dynamodb, CURRENT_MAX_SECTION - 20)

        else:
            logger.info(f"Creating random tasks for section {section} from previous sections")
            section_1, section_2 = get_two_random_sections(CURRENT_MAX_SECTION)

            tasks_1 = get_tasks_for_section(dynamodb, CURRENT_MAX_SECTION)
            tasks_2 = get_tasks_for_section(dynamodb, section_1)
            tasks_3 = get_tasks_for_section(dynamodb, section_2)

        selected_tasks_1 = chose_tasks(tasks_1, 3, 3, 2)
        selected_tasks_2 = chose_tasks(tasks_2, 2, 1, 1)
        selected_tasks_3 = chose_tasks(tasks_3, 1, 1, 1)

        selected_tasks = selected_tasks_1 + selected_tasks_2 + selected_tasks_3
        random.shuffle(selected_tasks)
        section_exists = False

    if section == 10 and section_exists:
        selected_tasks = chose_tasks(tasks, 4, 4, 2)

        for i in range(5):
            selected_tasks.append(random.choice(tasks))
    elif section == 20 and section_exists:
        selected_tasks = chose_tasks(tasks, 4, 4, 2)

        tasks = get_tasks_for_section(dynamodb, 10)
        prev_section_tasks = chose_tasks(tasks, 2, 2, 1)

        selected_tasks.extend(prev_section_tasks)
    elif section_exists:
        selected_tasks = chose_tasks(tasks, 4, 4, 2)

        prev_tasks_1 = get_tasks_for_section(dynamodb, section - 10)
        prev_tasks_2 = get_tasks_for_section(dynamodb, section - 20)

        prev_section_tasks_1 = chose_tasks(prev_tasks_1, 1, 1, 1)
        prev_section_tasks_2 = chose_tasks(prev_tasks_2, 1, 1, 0)

        selected_tasks.extend(prev_section_tasks_1)
        selected_tasks.extend(prev_section_tasks_2)

    selected_tasks = convert_decimal_to_float(selected_tasks)

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

    # Take the required number from each version
    chosen_tasks = []
    chosen_tasks.extend(tasks_by_version[1][:num_v1])
    chosen_tasks.extend(tasks_by_version[2][:num_v2])
    chosen_tasks.extend(tasks_by_version[3][:num_v3])

    random.shuffle(chosen_tasks)

    return chosen_tasks


def get_users_current_level(dynamodb, email):
    logger.info(f"Getting user by email {email}")
    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})
    if not user_item:
        return None

    user_current_level = user_item.get("current_level", 0)

    user_current_level = convert_decimal_to_float(user_current_level)

    return user_current_level


def get_two_random_sections(max_section):
    logger.info(f"Getting two random sections from 10 to {max_section + 10}")
    possible_sections = list(range(10, max_section + 10, 10))

    random.shuffle(possible_sections)
    section_1 = random.choice(possible_sections)
    possible_sections.remove(section_1)
    section_2 = random.choice(possible_sections)

    return section_1, section_2
