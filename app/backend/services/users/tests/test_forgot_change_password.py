import json
import sys
import os
import unittest
from datetime import datetime, timezone
from unittest.mock import patch

# Setup path resolution
def setup_paths():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..', '..', '..'))

    paths = [
        os.path.join(project_root, 'app', 'backend', 'services', 'users', 'forgotResetPassword'),
        os.path.join(project_root, 'app', 'backend', 'services', 'layers', 'common'),
        os.path.join(project_root, 'app', 'backend', 'services', 'users'),
        current_dir
    ]

    for path in paths:
        if path not in sys.path and os.path.exists(path):
            sys.path.insert(0, path)

    # Clear cache of potentially imported modules
    for module in ['validation_schema', 'common', 'forgotResetPassword.app']:
        if module in sys.modules:
            del sys.modules[module]

original_path = sys.path.copy()
setup_paths()

from base_test_setups import BaseTestSetup
from moto import mock_aws
from forgotResetPassword.app import lambda_handler
from common import hash_string, verify_hash_string


@mock_aws
class TestValidateResetCode(BaseTestSetup):
    def setUp(self):
        super().setUp()

        self.resource_patcher = patch('forgotResetPassword.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.table = self.dynamodb.Table(os.environ["USERS_TABLE_NAME"])
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


    def test_user_not_found(self):
        """
        Test response when user is not found.
        """
        event = {
            "body": json.dumps({
                "email": "nonexistent@mail.com",
                "password": "newPassword123"
            })
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(body['message'], "User does not exist.")


    def test_successful_password_reset(self):
        """
        Test successful password reset.
        """
        email = "test@mail.com"
        old_password = "oldPassword123"
        new_password = "newPassword123"

        hashed_password = hash_string(old_password)
        self.table.put_item(Item={
            'email': email,
            'password': hashed_password,
        })

        event = {
            "body": json.dumps({
                "email": email,
                "password": new_password,
            })
        }

        response = lambda_handler(event, {})

        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['message'], "Password reset successfully.")  # Updated message
        updated_user = self.table.get_item(Key={'email': email})['Item']
        self.assertFalse(verify_hash_string(old_password, updated_user['password']))
        self.assertTrue(verify_hash_string(new_password, updated_user['password']))


    def tearDown(self):
        self.resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path