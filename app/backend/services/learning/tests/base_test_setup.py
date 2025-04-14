import unittest
import os
import json
import jwt
from moto import mock_aws
from boto3 import resource, client

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
        os.environ["JWT_SECRET_NAME"] = "jwt_secret"
        os.environ["SECRETS_REGION_NAME"] = "eu-central-1"
        os.environ["AWS_REGION"] = "eu-central-1"

        # Mocked Secrets Manager
        self.secrets_manager = client('secretsmanager', region_name='eu-central-1')
        self.secrets_manager.create_secret(
            Name=os.environ["JWT_SECRET_NAME"],
            SecretString=json.dumps({
                "jwt_secret": "test_secret_key",
                "refresh_secret": "test_refresh_key",
            })
        )

        # Mock the get_secret_value method behavior
        self.secret_value = json.dumps({
            'jwt_secret': 'test_secret_key',
            'refresh_secret': 'test_refresh_key'
        })

        # Mocked DynamoDB
        self.dynamodb = resource('dynamodb', region_name='eu-central-1')

        # Create the tasks table
        self.tasks_table = self.dynamodb.create_table(
            TableName=os.environ["TASKS_TABLE_NAME"],
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "id", "AttributeType": "S"},
                {"AttributeName": "section", "AttributeType": "N"}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'section-index',
                    'KeySchema': [
                        {'AttributeName': 'section', 'KeyType': 'HASH'},
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode="PAY_PER_REQUEST"
        )

        # Wait for table creation
        self.tasks_table.meta.client.get_waiter('table_exists').wait(TableName=os.environ["TASKS_TABLE_NAME"])

        # Add sample test data
        self.seed_tasks_data()

        # Generate test JWT token
        self.test_jwt_token = jwt.encode(
            {"email": "test@example.com", "role": 1},
            "test_secret_key",
            algorithm="HS256"
        )

    def seed_tasks_data(self):
        """Seed the tasks table with test data"""
        # Create tasks for section 10
        for i in range(10):
            self.tasks_table.put_item(Item={
                'id': f'task10-{i}',
                'section': 10,
                'name': f'Task {i} - Section 10',
                'version': (i % 3) + 1  # Distribute across versions 1, 2, 3
            })

        # Create tasks for section 20
        for i in range(10):
            self.tasks_table.put_item(Item={
                'id': f'task20-{i}',
                'section': 20,
                'name': f'Task {i} - Section 20',
                'version': (i % 3) + 1
            })

        # Create tasks for section 30
        for i in range(10):
            self.tasks_table.put_item(Item={
                'id': f'task30-{i}',
                'section': 30,
                'name': f'Task {i} - Section 30',
                'version': (i % 3) + 1
            })