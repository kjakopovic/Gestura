import json
import sys
import os
import unittest
from unittest.mock import patch

from base_test_setup import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('getInventory')
BaseTestSetup.clear_module_cache(['common', 'getInventory.app'])

from moto import mock_aws
from getInventory.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestGetInventory(BaseTestSetup):
    def setUp(self):
        super().setUp()

        self.users_resource_patcher = patch('getInventory.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.items_resource_patcher = patch('getInventory.app._LAMBDA_ITEMS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["ITEMS_TABLE_NAME"]
        })
        self.battlepass_resource_patcher = patch('getInventory.app._LAMBDA_BATTLEPASS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["BATTLEPASS_TABLE_NAME"]
        })

        self.users_resource_patcher.start()
        self.items_resource_patcher.start()
        self.battlepass_resource_patcher.start()

        self.active_battlepass = {
            "season": "3",
            "name": "Season 3",
            "levels": [
                {
                    "level": 1,
                    "coins": 30,
                    "required_xp": 150,
                },
                {
                    "level": 2,
                    "coins": 60,
                    "required_xp": 250,
                },
                {
                    "level": 3,
                    "coins": 90,
                    "required_xp": 350,
                },
                {
                    "level": 4,
                    "coins": 120,
                    "required_xp": 450,
                },
                {
                    "level": 5,
                    "coins": 150,
                    "required_xp": 550,
                },
                {
                    "level": 6,
                    "coins": 180,
                    "required_xp": 650,
                }
            ],
            "start_date": "2025-05-01T00:00:00Z",
            "end_date": "2025-12-31T23:59:59Z",
        }
        self.battlepass_table.put_item(Item=self.active_battlepass)


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


    def test_user_not_found(self):
        """
        Test response when user is not found.
        """
        jwt_token = generate_jwt_token("random@mail.com")

        event = {
            'headers': {'Authorization': jwt_token}
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 404)
        self.assertIn("message", body)
        self.assertEqual(body['message'], "User not found.")


    def test_get_inventory_with_items(self):
        """
        Test getting inventory when user has items.
        """
        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        event = {
            'headers': {'Authorization': jwt_token}
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("items", body)
        self.assertIn("message", body)
        self.assertEqual(body['message'], "User inventory fetched successfully")


    def test_empty_inventory(self):
        """
        Test getting inventory when user has no items.
        """
        self.new_user = {
            "email": "new@mail.com",
            "items_inventory": []
        }
        self.users_table.put_item(Item=self.new_user)

        jwt_token = generate_jwt_token("new@mail.com")
        event = {
            'headers': {'Authorization': jwt_token}
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("items", body)
        self.assertEqual(body['items'], [])


    def test_no_active_battlepass(self):
        """
        Test getting inventory when there is no active battlepass.
        """
        self.battlepass_table.delete_item(Key={"season": "3"})
        self.battlepass_table.put_item(Item={
            "season": "3",
            "name": "Season 3",
            "levels": [
                {"level": 1, "coins": 30, "required_xp": 150}
            ],
            "start_date": "2020-01-01T00:00:00Z",
            "end_date": "2020-12-31T23:59:59Z"  # Past end date
        })

        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        event = {
            'headers': {'Authorization': jwt_token}
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("items", body)
        self.assertIn("message", body)
        self.assertEqual(body['message'], "User inventory fetched successfully")
        self.assertIn("active_battlepass", body)
        self.assertEqual(body['active_battlepass'], [])


    def tearDown(self):
        self.users_resource_patcher.stop()
        self.items_resource_patcher.stop()
        self.battlepass_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path