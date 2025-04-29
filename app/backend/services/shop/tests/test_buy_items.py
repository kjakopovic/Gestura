import json
import sys
import os
import unittest
from unittest.mock import patch

from moto.events import events_backends

from base_test_setup import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('buyItems')
BaseTestSetup.clear_module_cache(['common', 'buyItems.app'])

from moto import mock_aws
from buyItems.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestGetItems(BaseTestSetup):
    def setUp(self):
        super().setUp()

        self.items_resource_patcher = patch('buyItems.app._LAMBDA_ITEMS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["ITEMS_TABLE_NAME"]
        })
        self.users_resource_patcher = patch('buyItems.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.users_resource_patcher.start()
        self.items_resource_patcher.start()


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
            },
            "body": json.dumps({
                "item_id": "item-2"
            })
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 404)
        self.assertIn("message", body)

        self.assertEqual(body['message'], "User not found.")


    def test_validation_schema(self):
        """
        Test response when validation schema fails.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        test_cases = [
            {
                "request_body": {},
                "expected_validation_message": "data must contain ['item_id'] properties"
            },
            {
                "request_body": {
                    "item_id": 123
                },
                "expected_validation_message": "data.item_id must be string"
            },
            {
                "request_body": {
                    "item_id": "item123",
                    "extraField": "value"
                },
                "expected_validation_message": "data must not contain {'extraField'} properties"
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


    def test_successful_buy_coins(self):
        """
        Test that a user can successfully buy coins.
        """
        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        coins_item_id = "coins-1"

        initial_user = self.users_table.get_item(Key={'email': email})['Item']
        initial_coins = initial_user['coins']
        initial_items = initial_user['items']

        body_data = {
            "item_id": coins_item_id
        }

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "body": json.dumps(body_data)
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)
        self.assertIn("Coins added successfully", body['message'])

        updated_user = self.users_table.get_item(Key={'email': email})['Item']
        updated_coins = updated_user['coins']
        updated_items = updated_user['items']

        self.assertGreater(updated_coins, initial_coins)
        self.assertEqual(initial_coins + 100, updated_coins)
        self.assertEqual(updated_items, initial_items)



    def tearDown(self):
        self.items_resource_patcher.stop()
        self.users_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path