import boto3
import json
import logging
from os import environ

logger = logging.getLogger("boto3")
logger.setLevel(logging.INFO)

_LAMBDA_USERS_TABLE_RESOURCE = {
    "resource": boto3.resource("dynamodb"),
    "table_name": environ.get("USERS_TABLE_NAME", "test_table"),
}

_LAMBDA_TASKS_TABLE_RESOURCE = {
    "resource": boto3.resource("dynamodb"),
    "table_name": environ.get("TASKS_TABLE_NAME", "task_test_table"),
}

_LAMBDA_LANGUAGES_TABLE_RESOURCE = {
    "resource": boto3.resource("dynamodb"),
    "table_name": environ.get("LANGUAGES_TABLE_NAME", "languages_test_table"),
}

_LAMBDA_ITEMS_TABLE_RESOURCE = {
    "resource": boto3.resource("dynamodb"),
    "table_name": environ.get("ITEMS_TABLE_NAME", "items_test_table"),
}


class LambdaDynamoDBClass:
    """
    AWS DynamoDB Resource Class
    """

    def __init__(self, lambda_dynamodb_resource):
        """
        Initialize a DynamoDB Resource
        """
        self.resource = lambda_dynamodb_resource["resource"]
        self.table_name = lambda_dynamodb_resource["table_name"]
        self.table = self.resource.Table(self.table_name)


def get_secrets_from_aws_secrets_manager(secret_id, region_name):
    try:
        secrets_manager = boto3.client(
            service_name="secretsmanager", region_name=region_name
        )

        secret_string = secrets_manager.get_secret_value(SecretId=secret_id)

        return json.loads(secret_string["SecretString"])
    except Exception as e:
        logger.error(f"Failed to retrieve secrets: {str(e)}")
        return None
