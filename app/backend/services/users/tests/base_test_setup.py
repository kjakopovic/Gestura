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
        os.environ["LANGUAGES_TABLE_NAME"] = "test_languages_table"
        os.environ["BATTLEPASS_TABLE_NAME"] = "test_battlepass_table"
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

        # Items table
        self.dynamodb = resource('dynamodb', region_name='eu-central-1')
        self.items_table = self.dynamodb.create_table(
            TableName=os.environ["ITEMS_TABLE_NAME"],
            AttributeDefinitions=[
                {"AttributeName": "id", "AttributeType": "S"},
                {"AttributeName": "name", "AttributeType": "S"}
            ],
            KeySchema=[
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
        self.items_table.meta.client.get_waiter('table_exists').wait(TableName=os.environ["ITEMS_TABLE_NAME"])

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
            "battlepass": [
                {
                    "season_id": "1",
                    "xp": 0,
                    "claimed_levels": []
                },
                {
                    "season_id": "3",
                    "xp": 1500,
                    "claimed_levels": [1]
                }
            ],
            "coins": 100,
            "items_inventory": [
                {
                    "item_id": "item-1",
                    "quantity": 2,
                    "acquired_date": "2023-06-15T12:30:00Z"
                },
                {
                    "item_id": "item-3",
                    "quantity": 1,
                    "acquired_date": "2023-07-20T09:45:00Z"
                },
                {
                    "item_id": "chest-1",
                    "quantity": 3,
                    "acquired_date": "2023-08-05T18:20:00Z"
                },
                {
                    "item_id": "coins-1",
                    "quantity": 5,
                    "acquired_date": "2023-09-10T14:15:00Z"
                },
            ],
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

        # Sample items data
        self.sample_items = [
            {
                "id": "item-1",
                "name": "Full Hearts",
                "image_url": "https://example.com/images/full_hearts.png",
                "price": Decimal("100.00"),
                "category": "hearts",
                "effect": {"multiplier": 5}
            },
                {
                    "id": "item-2",
                    "name": "One Heart",
                    "image_url": "https://example.com/images/one_heart.png",
                    "price": Decimal("25.00"),
                    "category": "hearts",
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
                    "id": "coins-1",
                    "name": "Small Coin Pack",
                    "image_url": "https://example.com/images/small_coins.png",
                    "price": Decimal("1.99"),
                    "category": "coins",
                    "effect": {"coins": 100}
                },
                {
                    "id": "coin-2",
                    "name": "Medium Coin Pack",
                    "image_url": "https://example.com/images/medium_coins.png",
                    "price": Decimal("4.99"),
                    "category": "coins",
                    "effect": {"coins": 600}
                },
                {
                    "id": "chest-1",
                    "name": "Chest",
                    "category": "chest",
                    "price": 1000,
                    "image_url": "https://gestura-sign-language.s3.eu-central-1.amazonaws.com/shopItems/chest.png",
                    "effect": {
                        "items": [
                            {
                                "coins": 10,
                                "win_percentage": 15
                            },
                            {
                                "coins": 20,
                                "win_percentage": 15
                            },
                            {
                                "coins": 30,
                                "win_percentage": 15
                            },
                            {
                                "coins": 40,
                                "win_percentage": 15
                            },
                            {
                                "coins": 50,
                                "win_percentage": 12
                            },
                            {
                                "coins": 75,
                                "win_percentage": 8
                            },
                            {
                                "coins": 100,
                                "win_percentage": 8
                            },
                            {
                                "coins": 150,
                                "win_percentage": 8
                            },
                            {
                                "coins": 250,
                                "win_percentage": 3
                            },
                            {
                                "coins": 1000,
                                "win_percentage": 1
                            }
                        ]
                    }
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
            for module_name in modules:
                for name in list(sys.modules.keys()):
                    if module_name in name:
                        del sys.modules[name]

            # Also clear any validation_schema modules to prevent schema conflicts
            for name in list(sys.modules.keys()):
                if 'validation_schema' in name:
                    del sys.modules[name]