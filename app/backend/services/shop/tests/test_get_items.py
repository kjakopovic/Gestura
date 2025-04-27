import json
import sys
import os
import unittest
from unittest.mock import patch
from datetime import datetime, timedelta

from base_test_setup import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('getItems')
BaseTestSetup.clear_module_cache(['common', 'getItems.app'])

from moto import mock_aws
from getItems.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestGetItems(BaseTestSetup):
    def setUp(self):
        super().setUp()

        self.items_resource_patcher = patch('getItems.app._LAMBDA_ITEMS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["ITEMS_TABLE_NAME"]
        })
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


    def test_items_found(self):
        """
        Test response when items are found.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {
                'Authorization': jwt_token
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)

        self.assertEqual(body['message'], "Items fetched successfully")
        self.assertIn("items", body)
        self.assertIn("coins", body)
        self.assertIn("chests", body)

        self.assertIsNotNone(body['items'])
        self.assertIsNotNone(body['coins'])
        self.assertIsNotNone(body['chests'])


    def test_items_not_found(self):
        """
        Test response when no items are found.
        """
        # Clear all items from the table first
        items = self.items_table.scan()['Items']
        with self.items_table.batch_writer() as batch:
            for item in items:
                batch.delete_item(Key={'id': item['id']})
        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {
                'Authorization': jwt_token
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 404)
        self.assertEqual(body['message'], "No items found.")


    def tearDown(self):
        self.items_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path