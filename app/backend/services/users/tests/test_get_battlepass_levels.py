import json
import sys
import os
import unittest
from unittest.mock import patch
from base_test_setup import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('getBattlepassLevels')
BaseTestSetup.clear_module_cache(['validation_schema', 'common', 'getBattlepassLevels.app'])

from moto import mock_aws
from getBattlepassLevels.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestGetBattlepassLevels(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.battlepass_resource_patcher = patch('getBattlepassLevels.app._LAMBDA_BATTLEPASS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["BATTLEPASS_TABLE_NAME"]
        })
        self.battlepass_resource_patcher.start()


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


    def test_when_no_active_battlepasses(self):
        """
        Test response when there are no active battlepasses.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {'Authorization': jwt_token}
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 404)
        self.assertEqual(body['message'], "No active battlepasses found.")


    def test_when_active_battlepasses_found(self):
        """
        Test response when active battlepasses are found.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {'Authorization': jwt_token}
        }

        battlepass = {
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
            ],
            "start_date": "2025-05-01T00:00:00Z",
            "end_date": "2025-12-31T23:59:59Z",
        }

        self.battlepass_table.put_item(Item=battlepass)

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "Fetched battlepasses successfully")
        self.assertIn("battlepasses", body)
        self.assertEqual(len(body['battlepasses']), 1)
        self.assertEqual(body['battlepasses'][0]['season'], "3")


    def test_multiple_active_battlepasses(self):
        """
        Test response when multiple active battlepasses are found.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {'Authorization': jwt_token}
        }

        battlepasses = [
            {
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
                ],
                "start_date": "2025-05-01T00:00:00Z",
                "end_date": "2025-12-31T23:59:59Z",
            },
            {
                "season": "4",
                "name": "Season 4",
                "levels": [
                    {
                        "level": 1,
                        "coins": 35,
                        "required_xp": 200,
                    },
                    {
                        "level": 2,
                        "coins": 70,
                        "required_xp": 300,
                    },
                    {
                        "level": 3,
                        "coins": 105,
                        "required_xp": 400,
                    },
                    {
                        "level": 4,
                        "coins": 140,
                        "required_xp": 500,
                    },
                ],
                "start_date": "2025-05-01T00:00:00Z",
                "end_date": "2025-12-31T23:59:59Z",
            }
        ]

        for battlepass in battlepasses:
            self.battlepass_table.put_item(Item=battlepass)

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "Fetched battlepasses successfully")
        self.assertIn("battlepasses", body)
        self.assertEqual(len(body['battlepasses']), 2)
        self.assertEqual(body['battlepasses'][0]['season'], "3")
        self.assertEqual(body['battlepasses'][1]['season'], "4")


    def tearDown(self):
        self.battlepass_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path