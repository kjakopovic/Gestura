import unittest
import os
import json
from moto import mock_aws
from boto3 import resource, client


class LambdaS3Class:
    """
    AWS S3 Resource Class
    """
    def __init__(self, lambda_s3_client):
        """
        Initialize an S3 Resource
        """
        self.client = lambda_s3_client["client"]
        self.bucket_name = lambda_s3_client["bucket_name"]


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


@mock_aws
class BaseTestSetup(unittest.TestCase):
    def setUp(self):
        # Environment variables
        os.environ["TASKS_TABLE_NAME"] = "test_tasks_table"
        os.environ["JWT_SECRET_NAME"] = "secret"
        os.environ["SECRETS_REGION_NAME"] = "eu-central-1"
        os.environ["AWS_REGION"] = "eu-central-1"

        # Mocked Secrets Manager
        self.secrets_manager = client('secretsmanager', region_name='eu-central-1')

        self.secrets_manager.create_secret(
            Name=os.environ["JWT_SECRET_NAME"],
            SecretString=json.dumps(
                {
                    "jwt_secret": "value",
                    "refresh_secret": "value2",
                })
        )

        self.secrets_manager.get_secret_value = {
            'SecretString': json.dumps({
                'jwt_secret': 'value',
                'refresh_secret': 'value2'
            })
        }

        # Mocked DynamoDB
        self.dynamodb = resource('dynamodb', region_name='eu-central-1')
        self.table = self.dynamodb.create_table(
            TableName = os.environ["TASKS_TABLE_NAME"],
            AttributeDefinitions = [
                {"AttributeName": "taskId", "AttributeType": "S"},
                {"AttributeName": "section", "AttributeType": "N"}
            ],
            KeySchema = [
                {"AttributeName": "taskId", "KeyType": "HASH"}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'section-index',
                    'KeySchema': [
                        {"AttributeName": "section", "KeyType": "HASH"}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                    'ProvisionedThroughput': {
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                }
            ],
            BillingMode="PAY_PER_REQUEST"
        )
        self.table.meta.client.get_waiter('table_exists').wait(TableName = os.environ["TASKS_TABLE_NAME"])
