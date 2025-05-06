import unittest
import os
import sys
import json
from moto import mock_aws
from boto3 import resource, client
import bcrypt


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
        os.environ["LANGUAGES_TABLE_NAME"] = "test_languages_table"
        os.environ["BATTLEPASS_TABLE_NAME"] = "test_battlepass_table"
        os.environ["USERS_TABLE_NAME"] = "test_users_table"
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
        # Tasks table
        self.dynamodb = resource('dynamodb', region_name='eu-central-1')
        self.tasks_table = self.dynamodb.create_table(
            TableName=os.environ["TASKS_TABLE_NAME"],
            AttributeDefinitions=[
                {"AttributeName": "task_id", "AttributeType": "S"},
                {"AttributeName": "section", "AttributeType": "N"},
                {"AttributeName": "language_id", "AttributeType": "S"}  # Add language_id attribute
            ],
            KeySchema=[
                {"AttributeName": "task_id", "KeyType": "HASH"}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'section-language-index',  # Change to match template
                    'KeySchema': [
                        {"AttributeName": "section", "KeyType": "HASH"},
                        {"AttributeName": "language_id", "KeyType": "RANGE"}  # Add language_id as range key
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
        self.tasks_table.meta.client.get_waiter('table_exists').wait(TableName = os.environ["TASKS_TABLE_NAME"])

        # Users table
        self.users_table = self.dynamodb.create_table(
            TableName=os.environ["USERS_TABLE_NAME"],
            AttributeDefinitions=[
                {"AttributeName": "email", "AttributeType": "S"},
                {"AttributeName": "username", "AttributeType": "S"}
            ],
            KeySchema=[
                {"AttributeName": "email", "KeyType": "HASH"}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'username-index',
                    'KeySchema': [
                        {"AttributeName": "username", "KeyType": "HASH"}
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
        self.users_table.meta.client.get_waiter('table_exists').wait(TableName=os.environ["USERS_TABLE_NAME"])

        # Languages table
        self.languages_table = self.dynamodb.create_table(
            TableName=os.environ["LANGUAGES_TABLE_NAME"],
            AttributeDefinitions=[
                {"AttributeName": "id", "AttributeType": "S"},
            ],
            KeySchema=[
                {"AttributeName": "id", "KeyType": "HASH"}
            ],
            BillingMode="PAY_PER_REQUEST"
        )
        self.languages_table.meta.client.get_waiter('table_exists').wait(TableName=os.environ["LANGUAGES_TABLE_NAME"])

        # Battlepass table
        self.battlepass_table = self.dynamodb.create_table(
            TableName="test_battlepass_table",
            AttributeDefinitions=[
                {"AttributeName": "season", "AttributeType": "S"},
            ],
            KeySchema=[
                {"AttributeName": "season", "KeyType": "HASH"}
            ],
            BillingMode="PAY_PER_REQUEST"
        )
        self.battlepass_table.meta.client.get_waiter('table_exists').wait(TableName=os.environ["BATTLEPASS_TABLE_NAME"])

        # Sample user data
        self.sample_user_pass = "password123"

        self.sample_user = {
            "email": "test@mail.com",
            "username": "TestUser",
            "password": bcrypt.hashpw(self.sample_user_pass.encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
            "letters_learned": {},
            "current_level": {
                "es": 1,
                "hr": 11,
                "fr": 21,
            },
            "task_level": 0,
            "time_played": 0,
            "xp": 0,
            "battlepass_xp": [
                {
                    "season": "test_season",
                    "sum_of_xp": 0
                }
            ],
            "coins": 0
        }

        self.users_table.put_item(Item=self.sample_user)

        # Sample language data
        self.sample_languages = [
            {
                "id": "en",
                "name": "English"
            },
            {
                "id": "fr",
                "name": "French"
            },
            {
                "id": "es",
                "name": "Spanish"
            },
            {
                "id": "hr",
                "name": "Croatian"
            },
            {
                "id": "de",
                "name": "German"
            }

        ]

        for language in self.sample_languages:
            self.languages_table.put_item(Item=language)

        # Sample battlepass data
        self.sample_battlepasses = [
            {
                "season": "1",
                "name": "Season 1",
                "levels": [
                    {
                        "level": 1,
                        "coins": 25,
                        "required_xp": 100,
                    },
                    {
                        "level": 2,
                        "coins": 50,
                        "required_xp": 200,
                    },
                    {
                        "level": 3,
                        "coins": 75,
                        "required_xp": 300,
                    },
                    {
                        "level": 4,
                        "coins": 100,
                        "required_xp": 400,
                    },
                ],
                "start_date": "2023-01-01T00:00:00Z",
                "end_date": "2023-12-31T23:59:59Z",
                },
                {
                    "season": "2",
                    "name": "Season 2",
                    "levels": [
                        {
                            "level": 1,
                            "coins": 30,
                            "required_xp": 150,
                        },
                        {
                            "level": 2,
                            "coins": 60,
                            "required_xp": 250,
                        },
                        {
                            "level": 3,
                            "coins": 90,
                            "required_xp": 350,
                        },
                        {
                            "level": 4,
                            "coins": 120,
                            "required_xp": 450,
                        },
                    ],
                    "start_date": "2023-06-01T00:00:00Z",
                    "end_date": "2023-12-31T23:59:59Z",
                },
            ]

        for battlepass in self.sample_battlepasses:
            self.battlepass_table.put_item(Item=battlepass)


    @staticmethod
    def setup_paths(service_name=None):
        """
        Configure import paths for tests across different services.

        Args:
            service_name: Optional specific service name to include in path
        """
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..', '..', '..'))

        paths = [
            os.path.join(project_root, 'app', 'backend', 'services', 'layers', 'common'),
            os.path.join(project_root, 'app', 'backend', 'services', 'learning'),
            current_dir
        ]

        # Add service-specific path if provided
        if service_name:
            service_path = os.path.join(project_root, 'app', 'backend', 'services', 'learning', service_name)
            paths.insert(0, service_path)

        for path in paths:
            if path not in sys.path and os.path.exists(path):
                sys.path.insert(0, path)


    @staticmethod
    def clear_module_cache(modules=None):
        """
        Clear module cache for potentially imported modules

        Args:
            modules: List of module names to clear from cache
        """
        if modules:
            for module_name in modules:
                for name in list(sys.modules.keys()):
                    if module_name in name:
                        del sys.modules[name]

            # Also clear any validation_schema modules to prevent schema conflicts
            for name in list(sys.modules.keys()):
                if 'validation_schema' in name:
                    del sys.modules[name]