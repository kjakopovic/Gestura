import logging
import random
import os

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import SchemaValidationError, validate
from common import build_response, convert_decimal_to_float
from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_TASKS_TABLE_RESOURCE,
    _LAMBDA_USERS_TABLE_RESOURCE,
    _LAMBDA_LANGUAGES_TABLE_RESOURCE,
)
from middleware import middleware
from boto3.dynamodb.conditions import Key
from auth import get_email_from_jwt_token

logger = logging.getLogger("GetListOfTasks")
logger.setLevel(logging.DEBUG)

# Maximum section currently available in the database for fallback logic
CURRENT_MAX_SECTION = int(os.environ.get("CURRENT_MAX_SECTION", 10))


@dataclass
class Request:
    level: int


@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    # Extract and validate user identity from JWT token
    jwt_token = event.get("headers").get("x-access-token")
    email = get_email_from_jwt_token(jwt_token)

    if not email:
        logger.error(f"Invalid email in jwt token {email}")
        return build_response(400, {"message": "Invalid email in jwt token"})

    # Extract query parameters and validate against schema
    query_params = event.get("queryStringParameters", {})
    try:
        logger.debug(f"Validating query params: {query_params}")

        validate(event=query_params, schema=schema)
    except SchemaValidationError as e:
        logger.error(f"Validation failed: {e}")
        return build_response(400, {"message": str(e)})

    # Initialize DynamoDB resources for required tables
    global _LAMBDA_TASKS_TABLE_RESOURCE, _LAMBDA_USERS_TABLE_RESOURCE, _LAMBDA_LANGUAGES_TABLE_RESOURCE
    tasks_dynamodb = LambdaDynamoDBClass(_LAMBDA_TASKS_TABLE_RESOURCE)
    user_dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)
    languages_dynamodb = LambdaDynamoDBClass(_LAMBDA_LANGUAGES_TABLE_RESOURCE)

    # Verify requested language exists
    language_id = query_params.get("language", "")
    language = get_language_by_id(languages_dynamodb, language_id)
    if not language:
        logger.error(f"Language with id {language_id} not found")
        return build_response(404, {"message": "Language not found"})

    # Get user's current level and subscription status
    users_current_level, subscription = get_users_current_level_and_subscription(user_dynamodb, email, language_id)
    if users_current_level is None:
        logger.error(f"User {email} not found in the database.")
        return build_response(404, {"message": "User not found"})

    # Calculate section based on level (sections group 10 levels together)
    level = int(query_params.get("level", 1))
    section = (level // 10 + 1) * 10

    # Only allow users to access levels they've already reached
    if users_current_level == level:
        return get_list_of_tasks(tasks_dynamodb, section, language_id, subscription)
    else:
        logger.error(f"User {email} is not allowed to access level {level}.")
        return build_response(
            403,
            {
                "message": f"User {email} is not allowed to access level {convert_decimal_to_float(level)}.",
                "current_level": users_current_level,
            },
        )


def get_language_by_id(dynamodb, id):
    logger.info(f"Getting language by id {id}")
    language = dynamodb.table.get_item(Key={"id": id})

    language_item = language.get("Item", {})

    return language_item


def get_users_current_level_and_subscription(dynamodb, email, language_id):
    """
    Retrieve user's current level for a specific language and subscription status.
    If the user hasn't started the language yet, initializes their level to 1.

    Parameters:
        dynamodb: DynamoDB client for users table
        email: User's email address (primary key)
        language_id: Language identifier to get level for

    Returns:
        tuple: (current_level, subscription_status) or None if user not found
    """
    logger.info(f"Getting user level for email {email} and language {language_id}")
    user = dynamodb.table.get_item(Key={"email": email})

    user_item = user.get("Item", {})
    if not user_item:
        return None

    user_levels = user_item.get("current_level", {})
    logger.info(f"User levels: {user_levels} for email {email}")

    # If this language is new for the user, initialize at level 1
    if language_id not in user_levels:
        logger.info(f"Adding new language {language_id} to user {email}")
        user_levels[language_id] = 1

        dynamodb.table.update_item(
            Key={"email": email},
            UpdateExpression="SET current_level = :levels",
            ExpressionAttributeValues={":levels": user_levels},
        )

    return user_levels.get(language_id, 0), user_item.get("subscription", 0)


def get_list_of_tasks(dynamodb, section, language_id, subscription):
    """
    Generate a list of learning tasks for the user based on their section,
    language, and subscription status.

    Premium subscribers get more variety and advanced tasks.
    The function handles cases where tasks for a specific section aren't available
    by creating mixed tasks from previous sections.

    Parameters:
        dynamodb: DynamoDB client for tasks table
        section: Section number to fetch tasks for (groups of 10 levels)
        language_id: Language identifier for the tasks
        subscription: User's subscription level (0=free, 1+=premium)

    Returns:
        HTTP response with selected tasks
    """
    logger.info(f"Getting list of tasks for section {section}")

    # Attempt to get tasks for the requested section
    tasks = get_tasks_for_section(dynamodb, section, language_id)
    selected_tasks = []

    # If no tasks found for this section, use fallback logic
    if len(tasks) <= 0:
        logger.error(f"No tasks found for section: {section}. Getting random tasks.")

        if CURRENT_MAX_SECTION == 0:
            logger.error("No tasks found in the database.")
            return build_response(404, {"message": "No tasks found", "tasks": []})

        # Create a mix from the three most recent sections
        if CURRENT_MAX_SECTION + 10 == section and CURRENT_MAX_SECTION >= 30:
            logger.info(
                f"Creating random tasks for section {section} from previous sections"
            )
            tasks_1 = get_tasks_for_section(dynamodb, CURRENT_MAX_SECTION, language_id)
            tasks_2 = get_tasks_for_section(
                dynamodb, CURRENT_MAX_SECTION - 10, language_id
            )
            tasks_3 = get_tasks_for_section(
                dynamodb, CURRENT_MAX_SECTION - 20, language_id
            )

        # For other sections, use current max section and two random previous sections
        else:
            logger.info(
                f"Creating random tasks for section {section} from previous sections"
            )
            section_1, section_2 = get_two_random_sections(CURRENT_MAX_SECTION)

            tasks_1 = get_tasks_for_section(dynamodb, CURRENT_MAX_SECTION, language_id)
            tasks_2 = get_tasks_for_section(dynamodb, section_1, language_id)
            tasks_3 = get_tasks_for_section(dynamodb, section_2, language_id)

        # Select tasks based on subscription status
        # Premium users get more advanced tasks (version 3)
        if subscription >= 1:
            selected_tasks_1 = chose_tasks(tasks_1, 3, 3, 2)
            selected_tasks_2 = chose_tasks(tasks_2, 2, 1, 1)
            selected_tasks_3 = chose_tasks(tasks_3, 1, 1, 1)
        else:
            selected_tasks_1 = chose_tasks(tasks_1, 4, 4, 0)
            selected_tasks_2 = chose_tasks(tasks_2, 3, 1, 0)
            selected_tasks_3 = chose_tasks(tasks_3, 2, 1, 0)

        # Combine and shuffle all selected tasks
        selected_tasks = selected_tasks_1 + selected_tasks_2 + selected_tasks_3
        random.shuffle(selected_tasks)

    # If tasks for this section exist, build a set from this section and previous ones
    else:
        logger.info(f"Tasks found for section {section}.")
        # Select base tasks from current section based on subscription
        if subscription >= 1:
            selected_tasks = chose_tasks(tasks, 4, 4, 2)
        else:
            selected_tasks = chose_tasks(tasks, 5, 5, 0)

        # Special handling for initial sections
        if section == 10:
            # For first section, add 5 more random tasks for extra practice
            for i in range(5):
                selected_tasks.append(random.choice(tasks))

        # For second section, include some tasks from first section
        elif section == 20:
            tasks = get_tasks_for_section(dynamodb, 10, language_id)

            if subscription >= 1:
                prev_section_tasks = chose_tasks(tasks, 2, 2, 1)
            else:
                prev_section_tasks = chose_tasks(tasks, 3, 2, 0)

            selected_tasks.extend(prev_section_tasks)

        # For all other sections, include tasks from the two previous sections
        else:
            prev_tasks_1 = get_tasks_for_section(dynamodb, section - 10, language_id)
            prev_tasks_2 = get_tasks_for_section(dynamodb, section - 20, language_id)

            if subscription >= 1:
                prev_section_tasks_1 = chose_tasks(prev_tasks_1, 1, 1, 1)
                prev_section_tasks_2 = chose_tasks(prev_tasks_2, 1, 1, 0)
            else:
                prev_section_tasks_1 = chose_tasks(prev_tasks_1, 2, 1, 0)
                prev_section_tasks_2 = chose_tasks(prev_tasks_2, 1, 1, 0)

            selected_tasks.extend(prev_section_tasks_1)
            selected_tasks.extend(prev_section_tasks_2)

    # Convert any Decimal values to standard floats for JSON serialization
    selected_tasks = convert_decimal_to_float(selected_tasks)

    return build_response(
        200, {"message": "Tasks fetched successfully", "tasks": selected_tasks}
    )


def get_tasks_for_section(dynamodb, section, language_id):
    logger.info(f"Getting tasks for section {section} and language {language_id}")

    response = dynamodb.table.query(
        IndexName="section-language-index",
        KeyConditionExpression=(
            Key("section").eq(section) & Key("language_id").eq(language_id)
        ),
    )

    return response.get("Items", [])


def chose_tasks(tasks, num_v1, num_v2, num_v3):
    """
    Select a mix of tasks based on their version/difficulty level.

    Parameters:
        tasks: List of all available tasks to choose from
        num_v1: Number of version 1 (basic) tasks to include
        num_v2: Number of version 2 (intermediate) tasks to include
        num_v3: Number of version 3 (advanced) tasks to include

    Returns:
        list: Selected tasks with desired distribution of difficulty levels
    """
    tasks_by_version = {1: [], 2: [], 3: []}
    logger.info(f"choosing tasks from {len(tasks)} tasks")

    # Group tasks by their version
    for task in tasks:
        version = task.get("version")
        if version in tasks_by_version:
            tasks_by_version[version].append(task)

    # Shuffle tasks within each version group for randomness
    for version in tasks_by_version:
        random.shuffle(tasks_by_version[version])

    # Take the required number from each version
    chosen_tasks = []
    chosen_tasks.extend(tasks_by_version[1][:num_v1])
    chosen_tasks.extend(tasks_by_version[2][:num_v2])
    chosen_tasks.extend(tasks_by_version[3][:num_v3])

    random.shuffle(chosen_tasks)

    return chosen_tasks


def get_two_random_sections(max_section):
    """
        Select two random, distinct sections from the available range.
        Used for mixing tasks when a section doesn't have enough content.

        Parameters:
            max_section: The highest section number currently available

        Returns:
            tuple: Two different randomly selected section numbers
        """
    logger.info(f"Getting two random sections from 10 to {max_section + 10}")
    possible_sections = list(range(10, max_section + 10, 10))

    # Shuffle and select two distinct sections
    random.shuffle(possible_sections)
    section_1 = random.choice(possible_sections)
    possible_sections.remove(section_1)
    section_2 = random.choice(possible_sections)

    return section_1, section_2
