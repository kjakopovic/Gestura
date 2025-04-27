import unittest
import os
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
