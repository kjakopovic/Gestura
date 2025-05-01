import unittest
import os
import sys
import bcrypt
import json
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
        """
        Set up the environment for the tests.
        """
        # Environment variables
        os.environ["USERS_TABLE_NAME"] = "test_users_table"
        os.environ["LANGUAGES_TABLE_NAME"] = "test_languages_table"
        os.environ["JWT_SECRET_NAME"] = "secret"
        os.environ["SECRETS_REGION_NAME"] = "eu-central-1"
        os.environ["AWS_REGION"] = "eu-central-1"

        # Mocked Secrets Manager
        self.secrets_manager = client("secretsmanager", region_name="eu-central-1")

        self.secrets_manager.create_secret(
            Name = os.environ["JWT_SECRET_NAME"],
            SecretString = json.dumps(
                {
                    "jwt_secret": "value1",
                    "refresh_secret": "value2",
                })
        )

        self.secrets_manager.get_secret_value = lambda SecretId: {
            'SecretString': json.dumps({
                'jwt_secret': 'value1',
                'refresh_secret': 'value2'
            })
        }

        # Mocked DynamoDB
        self.dynamodb = resource('dynamodb', region_name='eu-central-1')
        self.users_table = self.dynamodb.create_table(
            TableName = os.environ["USERS_TABLE_NAME"],
            AttributeDefinitions = [
                {"AttributeName": "email", "AttributeType": "S"},
                {"AttributeName": "username", "AttributeType": "S"}
            ],
            KeySchema = [
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
        self.users_table.meta.client.get_waiter('table_exists').wait(TableName = os.environ["USERS_TABLE_NAME"])

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

        # Sample user data
        self.sample_user_pass = "password123"

        self.sample_user = {
            "email": "test@mail.com",
            "username": "TestUser",
            "password": bcrypt.hashpw(self.sample_user_pass.encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
            "sound_effects": True,
            "haptic_feedback": False,
            "push_notifications": True,
            "heart_refill": True,
            "daily_reminder": False,
            "subscription": 0,
            "phone_number": "+1234567890",
            "chosen_language": "en",
            "hearts": 5,
            "hearts_next_refill": None,
            "battlepass_xp": 3,
            "coins": 100,
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
            }
        ]

        for language in self.sample_languages:
            self.languages_table.put_item(Item=language)


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
            os.path.join(project_root, 'app', 'backend', 'services', 'users'),
            current_dir
        ]

        # Add service-specific path if provided
        if service_name:
            service_path = os.path.join(project_root, 'app', 'backend', 'services', 'users', service_name)
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
            for module in modules:
                if module in sys.modules:
                    del sys.modules[module]