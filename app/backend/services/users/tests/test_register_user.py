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
        os.path.join(project_root, 'app', 'backend', 'services', 'users', 'register'),
        os.path.join(project_root, 'app', 'backend', 'services', 'layers', 'common'),
        os.path.join(project_root, 'app', 'backend', 'services', 'users'),
        current_dir
    ]

    for path in paths:
        if path not in sys.path and os.path.exists(path):
            sys.path.insert(0, path)

    # Clear cache of potentially imported modules
    for module in ['validation_schema', 'common', 'register.app']:
        if module in sys.modules:
            del sys.modules[module]

# Save original path and setup test paths
# Otherwise unittest will not find the modules
original_path = sys.path.copy()
setup_paths()

from base_test_setups import BaseTestSetup
from moto import mock_aws
from register.app import lambda_handler

#python -m unittest discover -s tests -p "test*.py" -v

# TODO: CLEAN ALL OF THIS UP
@mock_aws
class TestRegisterUser(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.resource_patcher = patch('register.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.resource_patcher.start()

    def test_validation_schema(self):
        """
        Test response when validation schema is not satisfied.
        """

        test_cases = [
            {
                "request_body": {
                    "email": "test1@mail.com",
                    "password": "password123"
                },
                "expected_validation_message": "data must contain ['username'] properties"
            },
            {
                "request_body": {
                    "email": "test1@mail.com",
                    "password": "password123",
                    "username": "UserName",
                    "randomField": "randomValue"
                },
                "expected_validation_message": "data must not contain {'randomField'} properties"
            },
            {
                "request_body": {
                    "email": "test1",
                    "password": "password123",
                    "username": "UserName"
                },
                "expected_validation_message": "data.email must be email"
            },
            {
                "request_body": {
                    "email": "test1@mail.com",
                    "password": "password123",
                    "username": ""
                },
                "expected_validation_message": "data.username must be longer than or equal to 1 characters"
            },
            {
                "request_body": {
                    "email": "test1@mail.com",
                    "password": "12",
                    "username": "UserName"
                },
                "expected_validation_message": "data.password must be longer than or equal to 7 characters"
            }
        ]

        for case in test_cases:
            with self.subTest(request_body=case["request_body"],
                              expected_validation_message=case["expected_validation_message"]):
                event = {"body": json.dumps(case["request_body"])}

                response = lambda_handler(event, {})
                body = json.loads(response['body'])

                self.assertEqual(response['statusCode'], 400)
                self.assertIn(case["expected_validation_message"], body['message'])

    def test_when_username_already_taken(self):
        """
        Test response when username is already taken.
        """
        event = {
            "body": json.dumps({
                "email": "test2@mail.com",
                "password": "password123",
                "username": "TestUser"
            })
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(body['message'], "Username already in use.")

    def test_email_already_in_use(self):
        """
        Test response when email is already in use.
        """
        event = {
            "body": json.dumps({
                "email": "test@mail.com",
                "password": "password123",
                "username": "TestUser2"
            })
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(body['message'], "Email already in use.")

    def test_success(self):
        """
        Test response when user registers successfully.
        """
        event = {
            "body": json.dumps({
                "email": "test2@mail.com",
                "password": "password123",
                "username": "TestUser2"
            })
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "User created successfully")

    def tearDown(self):
        self.resource_patcher.stop()
        super().tearDown()

if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        # Restore original path when done
        sys.path = original_path