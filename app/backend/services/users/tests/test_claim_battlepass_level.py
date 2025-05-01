import json
import sys
import os
import unittest
from unittest.mock import patch
from base_test_setup import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('claimBattlepassLevel')
BaseTestSetup.clear_module_cache(['validation_schema', 'common', 'claimBattlepassLevel.app'])

from moto import mock_aws
from claimBattlepassLevel.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestClaimBattlepassLevel(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.resource_patcher = patch('claimBattlepassLevel.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.resource_patcher.start()

    def test_when_user_not_authorized(self):
        """
        Test response when a user is unauthorized.
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
        jwt_token = generate_jwt_token("test@mail.com")

        test_cases = [
            {
                "request_query": {},
                "expected_validation_message": "data must contain ['battlepass_level'] properties"
            },
            {
                "request_query": {
                    "battlepass_level": 1
                },
                "expected_validation_message": "data.battlepass_level must be string"
            },
            {
                "request_query": {
                    "battlepass_level": "invalid"
                },
                "expected_validation_message": "data.battlepass_level must match pattern"
            },
            {
                "request_query": {
                    "battlepass_level": "1",
                    "extraField": "value"
                },
                "expected_validation_message": "data must not contain {'extraField'} properties"
            }
        ]

        for case in test_cases:
            with self.subTest(request_query=case["request_query"],
                              expected_status_code=case["expected_validation_message"]):
                event = {
                    'headers': {
                        'Authorization': jwt_token
                    },
                    "queryStringParameters": case["request_query"]
                }

                response = lambda_handler(event, {})
                body = json.loads(response['body'])

                self.assertEqual(response['statusCode'], 400)
                self.assertIn(case["expected_validation_message"], body['message'])


    def test_user_not_found(self):
        """
        Test response when user is not found in the database.
        """
        jwt_token = generate_jwt_token("random@mail.com")
        request_query = {
            "battlepass_level": "1"
        }

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": request_query
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 404)
        self.assertEqual(body['message'], "User not found")


    def test_invalid_battlepass_level(self):
        """
        Test response when the battlepass level is invalid.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        # User already has battlepass_xp of 3, so claiming level 5 should fail
        request_query = {
            "battlepass_level": "5"
        }

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": request_query
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(body['message'], "Not able to claim battlepass level 5, not enough xp.")


    def test_battlepass_level_already_claimed(self):
        """
        Test response when the battlepass level has already been claimed.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        # User already has battlepass_xp of 3, so claiming level 2 should fail
        request_query = {
            "battlepass_level": "2"
        }

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": request_query
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(body['message'], "Battlepass level 2 has already been claimed.")


    def test_successful_claim(self):
        """
        Test response when the battlepass level is successfully claimed.
        """
        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        initial_user = self.users_table.get_item(Key={'email': email})['Item']
        initial_coins = initial_user['coins']

        # User already has battlepass_xp of 3, so claiming level 3 should succeed
        request_query = {
            "battlepass_level": "3"
        }

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": request_query
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "Battlepass level claimed successfully.")

        updated_user = self.users_table.get_item(Key={'email': email})['Item']
        updated_coins = updated_user['coins']

        self.assertEqual(initial_coins + 3 * 25, updated_coins)


    def tearDown(self):
        self.resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path