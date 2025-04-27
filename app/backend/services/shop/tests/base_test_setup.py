import unittest
import os
import sys
import bcrypt
import json
from moto import mock_aws
from boto3 import resource, client
from decimal import Decimal

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
        os.environ["ITEMS_TABLE_NAME"] = "test_items_table"
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

        # Items table
        self.dynamodb = resource('dynamodb', region_name='eu-central-1')
        self.items_table = self.dynamodb.create_table(
            TableName = os.environ["ITEMS_TABLE_NAME"],
            AttributeDefinitions = [
                {"AttributeName": "id", "AttributeType": "S"},
                {"AttributeName": "name", "AttributeType": "S"}
            ],
            KeySchema = [
                {"AttributeName": "id", "KeyType": "HASH"}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'name-index',
                    'KeySchema': [
                        {"AttributeName": "name", "KeyType": "HASH"}
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
        self.items_table.meta.client.get_waiter('table_exists').wait(TableName = os.environ["ITEMS_TABLE_NAME"])


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
        }

        self.users_table.put_item(Item=self.sample_user)

        # Sample items data
        self.sample_items = [
            {
                "id": "item-1",
                "name": "Full Hearts",
                "image_url": "https://example.com/images/full_hearts.png",
                "price": Decimal("100.00"),
                "category": "item",
                "effect": {"hearts": {"amount": 5}}
            },
            {
                "id": "item-2",
                "name": "One Heart",
                "image_url": "https://example.com/images/one_heart.png",
                "price": Decimal("25.00"),
                "category": "item",
                "effect": {"hearts": {"amount": 1}}
            },
            {
                "id": "item-3",
                "name": "Double XP",
                "image_url": "https://example.com/images/double_xp.png",
                "price": Decimal("150.00"),
                "category": "item",
                "effect": {"xp": {"multiplier": 2, "seconds_in_use": 3600}}
            },
            {
                "id": "coin-1",
                "name": "Small Coin Pack",
                "image_url": "https://example.com/images/small_coins.png",
                "price": Decimal("1.99"),
                "category": "coin",
                "effect": {"coins": {"amount": 100}}
            },
            {
                "id": "coin-2",
                "name": "Medium Coin Pack",
                "image_url": "https://example.com/images/medium_coins.png",
                "price": Decimal("4.99"),
                "category": "coin",
                "effect": {"coins": {"amount": 600}}
            },
            {
                "id": "chest-1",
                "name": "Bronze Chest",
                "image_url": "https://example.com/images/bronze_chest.png",
                "price": Decimal("50.00"),
                "category": "chest",
                "effect": {"items": {"min_items": 1, "max_items": 3}}
            },
            {
                "id": "chest-2",
                "name": "Gold Chest",
                "image_url": "https://example.com/images/gold_chest.png",
                "price": Decimal("50.00"),
                "category": "chest",
                "effect": {"items": {"min_items": 4, "max_items": 8}}
            }
        ]

        # Insert sample items into the items table
        for item in self.sample_items:
            self.items_table.put_item(Item=item)


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
            os.path.join(project_root, 'app', 'backend', 'services', 'shop'),
            current_dir
        ]

        # Add service-specific path if provided
        if service_name:
            service_path = os.path.join(project_root, 'app', 'backend', 'services', 'shop', service_name)
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