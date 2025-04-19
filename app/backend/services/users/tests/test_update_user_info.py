import json
import sys
import os
import unittest
from unittest.mock import patch

# Setup path resolution
def setup_paths():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..', '..', '..'))

    paths = [
        os.path.join(project_root, 'app', 'backend', 'services', 'users', 'updateUserInfo'),
        os.path.join(project_root, 'app', 'backend', 'services', 'layers', 'common'),
        os.path.join(project_root, 'app', 'backend', 'services', 'users'),
        current_dir
    ]

    for path in paths:
        if path not in sys.path and os.path.exists(path):
            sys.path.insert(0, path)

    # Clear cache of potentially imported modules
    for module in ['validation_schema', 'common', 'updateUserInfo.app']:
        if module in sys.modules:
            del sys.modules[module]

# Save original path and setup test paths
# Otherwise unittest will not find the modules
original_path = sys.path.copy()
setup_paths()

from base_test_setups import BaseTestSetup
from moto import mock_aws
from updateUserInfo.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestRegisterUser(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.resource_patcher = patch('updateUserInfo.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.resource_patcher.start()


    def test_when_user_not_authorized(self):
        """
        Test response when user is unauthorized.
        """
        event = {
            'headers': {'Authorization': 'invalid-token'}
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 401)
        self.assertEqual(body['message'], "Invalid token, please login again")


    def test_user_not_found(self):
        """
        Test response when user is not found.
        """
        jwt_token = generate_jwt_token("random@mail.com")

        event = {
            'headers': {
                'Authorization': jwt_token
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 404)
        self.assertIn("message", body)

        self.assertEqual(body['message'], "User not found.")


    def test_validation_schema(self):
        """
        Test response when validation schema is not satisfied.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        test_cases = [
            {
                "request_body": {"invalid_field": "value"},
                "expected_validation_message": "data must not contain {'invalid_field'} properties"
            },
            # Invalid types
            {
                "request_body": {"sound_effects": "not-a-boolean"},
                "expected_validation_message": "data.sound_effects must be boolean"
            },
            {
                "request_body": {"chosen_language": 123},
                "expected_validation_message": "data.chosen_language must be string"
            },
            # Invalid phone format
            {
                "request_body": {"phone_number": "abc"},
                "expected_validation_message": "data.phone_number must match pattern"
            },
            # Invalid language enum value
            {
                "request_body": {"chosen_language": "ru"},
                "expected_validation_message": "data.chosen_language must be one of ['en', 'es', 'fr', 'de']"
            },
            # Invalid subscription enum value
            {
                "request_body": {"subscription": 3},
                "expected_validation_message": "data.subscription must be one of [0, 1, 2]"
            },
        ]

        for case in test_cases:
            with self.subTest(request_body=case["request_body"],
                              expected_validation_message=case["expected_validation_message"]):
                event = {
                    'headers': {
                        'Authorization': jwt_token
                    },
                    "body": json.dumps(case["request_body"])
                }

                response = lambda_handler(event, {})
                body = json.loads(response['body'])

                self.assertEqual(response['statusCode'], 400)
                self.assertIn("message", body)
                self.assertIn(case["expected_validation_message"], body['message'])


    def test_update_user_info(self):
        """
        Test response when user info is updated successfully.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        # Update to flat structure to match the Request dataclass
        update_data = {
            "username": "new_username",
            "sound_effects": False
        }

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "body": json.dumps(update_data)
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)
        self.assertIn("User updated successfully", body['message'])

        # Verify the update was applied by fetching the user
        users_table = self.dynamodb.Table(os.environ["USERS_TABLE_NAME"])
        result = users_table.get_item(Key={"email": "test@mail.com"})
        user = result.get('Item', {})

        # Check if specific fields were updated
        self.assertEqual(user.get("username"), "new_username")
        self.assertEqual(user.get("sound_effects"), False)


    def test_update_user_comprehensive_schema_valid(self):
        """
        Test changing multiple user properties according to the validation schema.
        """
        # Create a test user with initial values
        users_table = self.dynamodb.Table(os.environ["USERS_TABLE_NAME"])
        users_table.put_item(Item={
            "email": "test1@mail.com",
            "username": "original_username",
            "sound_effects": True,
            "haptic_feedback": False,
            "push_notifications": True,
            "heart_refill": True,
            "daily_reminder": False,
            "subscription": 0,
            "chosen_language": "en",
            "phone_number": "+1234567890"
        })

        jwt_token = generate_jwt_token("test1@mail.com")

        # Update with flat structure
        update_data = {
            "username": "updated_username",
            "phone_number": "+9876543210",
            "sound_effects": False,
            "haptic_feedback": True,
            "push_notifications": False,
            "heart_refill": False,
            "daily_reminder": True,
            "subscription": 1,
            "chosen_language": "fr"
        }

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "body": json.dumps(update_data)
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)
        self.assertIn("User updated successfully", body['message'])

        # User should still exist at the same email
        result = users_table.get_item(Key={"email": "test1@mail.com"})
        self.assertIn("Item", result)

        user = result["Item"]

        # Verify all updates were applied correctly according to schema
        self.assertEqual(user["username"], "updated_username")
        self.assertEqual(user["phone_number"], "+9876543210")
        self.assertEqual(user["sound_effects"], False)
        self.assertEqual(user["haptic_feedback"], True)
        self.assertEqual(user["push_notifications"], False)
        self.assertEqual(user["heart_refill"], False)
        self.assertEqual(user["daily_reminder"], True)
        self.assertEqual(user["subscription"], 1)
        self.assertEqual(user["chosen_language"], "fr")


    def tearDown(self):
        self.resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        # Restore original path when done
        sys.path = original_path