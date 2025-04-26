import json
import sys
import os
import unittest
from unittest.mock import patch
from base_test_setups import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('getUserInfo')
BaseTestSetup.clear_module_cache(['common', 'getUserInfo.app'])

from moto import mock_aws
from getUserInfo.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestGetUserInfo(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.users_resource_patcher = patch('getUserInfo.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.languages_resource_patcher = patch('getUserInfo.app._LAMBDA_LANGUAGES_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["LANGUAGES_TABLE_NAME"]
        })
        self.users_resource_patcher.start()
        self.languages_resource_patcher.start()


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


    def test_user_found(self):
        """
        Test response when user is found.
        """
        email = self.sample_user["email"]
        jwt_token = generate_jwt_token(email)

        event = {
            'headers': {
                'Authorization': jwt_token
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn('message', body)
        self.assertIn('users', body)
        self.assertIn('languages', body)


    def tearDown(self):
        self.users_resource_patcher.stop()
        self.languages_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path