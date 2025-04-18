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
            {
                "request_body": {"settings": {"invalid_section": {}}},
                "expected_validation_message": "data.settings must not contain {'invalid_section'} properties"
            },
            # Invalid types
            {
                "request_body": {"settings": {"preferences": {"soundEffects": "not-a-boolean"}}},
                "expected_validation_message": "data.settings.preferences.soundEffects must be boolean"
            },
            {
                "request_body": {"settings": {"languageSettings": {"language": 123}}},
                "expected_validation_message": "data.settings.languageSettings.language must be string"
            },
            # Invalid email format
            {
                "request_body": {"settings": {"profile": {"email": "not-an-email"}}},
                "expected_validation_message": "data.settings.profile.email must be email"
            },
            # Invalid phone format
            {
                "request_body": {"settings": {"profile": {"phone": "abc"}}},
                "expected_validation_message": "data.settings.profile.phone must match pattern"
            },
            # Extra properties in nested objects
            {
                "request_body": {"settings": {"profile": {"extra_field": "value"}}},
                "expected_validation_message": "data.settings.profile must not contain {'extra_field'} properties"
            },
            {
                "request_body": {"settings": {"notifications": {"extra_setting": True}}},
                "expected_validation_message": "data.settings.notifications must not contain {'extra_setting'} properties"
            }
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

        update_data = {
            "settings": {
                "profile": {
                    "username": "new_username"
                },
                "preferences": {
                    "soundEffects": False
                }
            }
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
        # You might need to directly query DynamoDB for this
        users_table = self.dynamodb.Table(os.environ["USERS_TABLE_NAME"])
        result = users_table.get_item(Key={"email": "test@mail.com"})
        user = result.get('Item', {})

        # Check if specific fields were updated
        self.assertEqual(user.get("username"), "new_username")
        self.assertEqual(user.get("settings", {}).get("preferences", {}).get("soundEffects"), False)


    def test_update_user_email(self):
        """Test updating a user's email address."""
        jwt_token = generate_jwt_token("test@mail.com")

        update_data = {
            "settings": {
                "profile": {
                    "email": "new_email@mail.com"
                }
            }
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
        self.assertIn("new_email", body)
        self.assertEqual(body["new_email"], "new_email@mail.com")

        # Old user should not exist
        users_table = self.dynamodb.Table(os.environ["USERS_TABLE_NAME"])
        old_result = users_table.get_item(Key={"email": "test@mail.com"})
        self.assertNotIn("Item", old_result)

        # New user should exist
        new_result = users_table.get_item(Key={"email": "new_email@mail.com"})
        self.assertIn("Item", new_result)


    def test_update_user_comprehensive_schema_valid(self):
        """
        Test changing multiple user properties according to the validation schema.
        """
        # Create a test user with initial values
        users_table = self.dynamodb.Table(os.environ["USERS_TABLE_NAME"])
        users_table.put_item(Item={
            "email": "test1@mail.com",
            "username": "original_username",
            "settings": {
                "preferences": {
                    "soundEffects": True,
                    "hapticFeedback": False
                },
                "notifications": {
                    "pushNotifications": True,
                    "heartRefill": True,
                    "dailyReminder": False,
                    "subscription": True
                },
                "languageSettings": {
                    "language": "en"
                },
                "profile": {
                    "phone": "+1234567890"
                }
            }
        })

        jwt_token = generate_jwt_token("test1@mail.com")

        # Create update data that strictly follows the validation schema
        update_data = {
            "settings": {
                "profile": {
                    "username": "updated_username",
                    "email": "updated@mail.com",
                    "phone": "+9876543210"
                },
                "preferences": {
                    "soundEffects": False,
                    "hapticFeedback": True
                },
                "notifications": {
                    "pushNotifications": False,
                    "heartRefill": False,
                    "dailyReminder": True,
                    "subscription": False
                },
                "languageSettings": {
                    "language": "fr"
                }
            }
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
        self.assertIn("new_email", body)
        self.assertEqual(body["new_email"], "updated@mail.com")

        # Old user should not exist
        old_result = users_table.get_item(Key={"email": "test1@mail.com"})
        self.assertNotIn("Item", old_result)

        # New user should exist with all updated properties
        new_result = users_table.get_item(Key={"email": "updated@mail.com"})
        self.assertIn("Item", new_result)

        user = new_result["Item"]
        settings = user.get("settings", {})

        # Verify all updates were applied correctly according to schema
        self.assertEqual(user["username"], "updated_username")
        self.assertEqual(settings["profile"]["phone"], "+9876543210")
        self.assertEqual(settings["preferences"]["soundEffects"], False)
        self.assertEqual(settings["preferences"]["hapticFeedback"], True)
        self.assertEqual(settings["notifications"]["pushNotifications"], False)
        self.assertEqual(settings["notifications"]["heartRefill"], False)
        self.assertEqual(settings["notifications"]["dailyReminder"], True)
        self.assertEqual(settings["notifications"]["subscription"], False)
        self.assertEqual(settings["languageSettings"]["language"], "fr")


    def tearDown(self):
        self.resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        # Restore original path when done
        sys.path = original_path