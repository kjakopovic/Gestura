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
        os.path.join(project_root, 'app', 'backend', 'services', 'users', 'login'),
        os.path.join(project_root, 'app', 'backend', 'services', 'layers', 'common'),
        os.path.join(project_root, 'app', 'backend', 'services', 'users'),
        current_dir
    ]

    for path in paths:
        if path not in sys.path and os.path.exists(path):
            sys.path.insert(0, path)

    # Clear cache of potentially imported modules
    for module in ['validation_schema', 'common', 'login.app']:
        if module in sys.modules:
            del sys.modules[module]

# Save original path and setup test paths
# Otherwise unittest will not find the modules
original_path = sys.path.copy()
setup_paths()

from base_test_setups import BaseTestSetup
from moto import mock_aws
from login.app import lambda_handler


@mock_aws
class TestLoginUser(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.resource_patcher = patch('login.app._LAMBDA_USERS_TABLE_RESOURCE', {
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
                "request_body": {},
                "expected_validation_message": "data must contain ['email', 'password'] properties"
            },
            {
                "request_body": {
                    "email": "test@mail.com"
                },
                "expected_validation_message": "data must contain ['password'] properties"
            },
            {
                "request_body": {
                    "password": "password123"
                },
                "expected_validation_message": "data must contain ['email'] properties"
            },
            {
                "request_body": {
                    "email": "invalid-email",
                    "password": "password123"
                },
                "expected_validation_message": "data.email must be email"
            },
            {
                "request_body": {
                    "email": "test@mail.com",
                    "password": "short"
                },
                "expected_validation_message": "data.password must be longer than or equal to 7 characters"
            },
            {
                "request_body": {
                    "email": "test@mail.com",
                    "password": "password123",
                    "extraField": "value"
                },
                "expected_validation_message": "data must not contain {'extraField'} properties"
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


    def test_successful_login(self):
        """
        Test that a user can successfully login with valid credentials.
        """
        event = {
            'body': json.dumps({
                'email': "test@mail.com",
                'password': "password123"
            })
        }

        response = lambda_handler(event, {})

        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertIn('access_token', body)
        self.assertIn('refresh_token', body)
        self.assertEqual(body['message'], 'User logged in successfully')


    def test_user_not_found(self):
        """
        Test response when user email is not found.
        """

        event = {
            'body': json.dumps({
                'email': 'randommail@mail.com',
                'password': 'password123'
            })
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        # Assert
        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(body['message'], "Wrong email or password")


    def test_incorrect_password(self):
        """
        Test response when user password is incorrect.
        """
        event = {
            "body": json.dumps({
                "email": "test@mail.com",
                "password": "password123!!!"
            })
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(body['message'], "Wrong email or password")


    def tearDown(self):
        self.resource_patcher.stop()
        super().tearDown()

if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path