import logging
import json
import uuid

from validation_schema import schema
from dataclasses import dataclass
from aws_lambda_powertools.utilities.validation import validate, SchemaValidationError
from common import build_response
from boto import LambdaDynamoDBClass, _LAMBDA_TASKS_TABLE_RESOURCE
from middleware import middleware
from typing import List


logger = logging.getLogger("CreateTask")
logger.setLevel(logging.DEBUG)


@dataclass
class Request:
    section: int
    sectionName: str
    version: int
    question: str
    possibleAnswers: List[str]
    correctAnswerIndex: int

# TODO: Check how will it be for RBAC
@middleware
def lambda_handler(event, context):
    logger.debug(f"Received event: {event}")

    body = event.get("body")
    if body is not None:
        request_body = json.loads(body)
    else:
        request_body = event

    try:
        logger.debug(f"Validating request: {request_body}")
        validate(event=request_body, schema=schema)
    except SchemaValidationError as e:
        logger.error(f"Validation failed: {e}")
        return build_response(400, {"message": str(e)})

    logger.info("Parsing request body")
    request = Request(**request_body)

    global _LAMBDA_TASKS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_TASKS_TABLE_RESOURCE)

    logger.info(f"Saving a task into database: {request}")
    task_id = str(uuid.uuid4())

    new_task ={
        "taskId": task_id,
        "section": request.section,
        "sectionName": request.sectionName,
        "version": request.version,
        "question": request.question,
        "possibleAnswers": request.possibleAnswers,
        "correctAnswerIndex": request.correctAnswerIndex,
    }

    try:
        dynamodb.table.put_item(Item=new_task)
    except Exception as e:
        logger.error("Error saving task to DynamoDB: %s", e)
        return build_response(500, {"message": "Error saving news to DynamoDB"})

    return build_response(
        200,
        {
            "message": "Task created successfully",
        }
    )
