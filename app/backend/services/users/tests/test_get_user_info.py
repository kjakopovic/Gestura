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
        os.path.join(project_root, 'app', 'backend', 'services', 'users', 'getUserInfo'),
        os.path.join(project_root, 'app', 'backend', 'services', 'layers', 'common'),
        os.path.join(project_root, 'app', 'backend', 'services', 'users'),
        current_dir
    ]

    for path in paths:
        if path not in sys.path and os.path.exists(path):
            sys.path.insert(0, path)

    # Clear cache of potentially imported modules
    for module in ['validation_schema', 'common', 'getUserInfo.app']:
        if module in sys.modules:
            del sys.modules[module]

# Save original path and setup test paths
# Otherwise unittest will not find the modules
original_path = sys.path.copy()
setup_paths()

from base_test_setups import BaseTestSetup
from moto import mock_aws
from getUserInfo.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestGetUserInfo(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.resource_patcher = patch('getUserInfo.app._LAMBDA_USERS_TABLE_RESOURCE', {
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


    def test_validation_schema(self):
        """
        Test response when validation schema is not satisfied.
        """
        jwt_token = generate_jwt_token(self.sample_user["email"])

        test_cases = [
            {
                "request_path": {},
                "expected_status_code": 500,
            },
            {
                "request_path": {
                    "email": "invalid_mail"
                },
                "expected_status_code": 500,
            },
            {
                "request_path": {
                    "email": "valid@mail.com",
                    "extra_field": "extra_value"
                },
                "expected_status_code": 500
            }
        ]

        for case in test_cases:
            with self.subTest(request_path=case["request_path"],
                              expected_status_code=case["expected_status_code"]):
                event = {
                    'headers': {
                        'Authorization': jwt_token
                    },
                    "pathParameters": case["request_path"]
                }

                response = lambda_handler(event, {})
                body = json.loads(response['body'])

                self.assertEqual(response['statusCode'], case["expected_status_code"])
                self.assertIn('message', body)
                self.assertEqual(body['message'], 'Internal server error')


    def test_user_not_found(self):
        """
        Test response when user is not found.
        """
        jwt_token = generate_jwt_token("random@mail.com")

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            'pathParameters': {
                "email": "random@mail.com"
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 404)
        self.assertIn("message", body)

        self.assertEqual(body['message'], "User not found.")


    def test_user_found(self):
        """
        Test response when user is found.
        """
        email = self.sample_user["email"]
        jwt_token = generate_jwt_token(email)

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            'pathParameters': {
                "email": email
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn('message', body)
        print(response['body'])