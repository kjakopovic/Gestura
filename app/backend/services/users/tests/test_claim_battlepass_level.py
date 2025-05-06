import json
import sys
import os
import unittest
from unittest.mock import patch
from base_test_setup import BaseTestSetup
from decimal import Decimal

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

        # Create a patcher for the DynamoDB resource in the lambda handler
        self.users_resource_patcher = patch('claimBattlepassLevel.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.battlepass_resource_patcher = patch('claimBattlepassLevel.app._LAMBDA_BATTLEPASS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["BATTLEPASS_TABLE_NAME"]
        })

        self.users_resource_patcher.start()
        self.battlepass_resource_patcher.start()

        self.active_battlepass ={
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

        # Update the sample user's battlepass to include the new fields
        user = self.users_table.get_item(Key={"email": "test@mail.com"})["Item"]
        user_battlepasses = user.get("battlepass", [])

        # Update Season 3 battlepass with the new fields
        for i, bp in enumerate(user_battlepasses):
            if bp.get("season_id") == "3":
                user_battlepasses[i]["current_level"] = 3
                user_battlepasses[i]["unlocked_levels"] = [1, 2, 3]
                user_battlepasses[i]["locked_levels"] = [4, 5, 6]

        # Update Season 1 battlepass with the new fields (if exists)
        for i, bp in enumerate(user_battlepasses):
            if bp.get("season_id") == "1":
                user_battlepasses[i]["current_level"] = 0
                user_battlepasses[i]["unlocked_levels"] = []
                user_battlepasses[i]["locked_levels"] = [1, 2, 3, 4]

        self.users_table.update_item(
            Key={"email": "test@mail.com"},
            UpdateExpression="SET battlepass = :battlepass",
            ExpressionAttributeValues={
                ":battlepass": user_battlepasses
            }
        )


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
        Test response when the validation schema is not satisfied.
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
        Test response when a user is not found in the database.
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

        request_query = {
            "battlepass_level": "8"
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
        self.assertEqual(body['message'], "Battlepass level not found")


    def test_battlepass_level_already_claimed(self):
        """
        Test response when the battlepass level has already been claimed.
        """
        jwt_token = generate_jwt_token("test@mail.com")

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

        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(body['message'], "Battlepass level 1 has already been claimed.")


    def test_successful_claim(self):
        """
        Test response when the battlepass level is successfully claimed.
        """
        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        initial_user = self.users_table.get_item(Key={'email': email})['Item']
        initial_coins = initial_user['coins']

        initial_battlepass = next((bp for bp in initial_user['battlepass'] if bp.get('season_id') == '3'), None)
        initial_claimed_levels = initial_battlepass.get('claimed_levels', [])

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

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "Battlepass level 2 claimed successfully")

        updated_user = self.users_table.get_item(Key={'email': email})['Item']
        updated_coins = updated_user['coins']

        # Get the updated battlepass data
        updated_battlepass = next((bp for bp in updated_user['battlepass'] if bp.get('season_id') == '3'), None)
        updated_claimed_levels = updated_battlepass.get('claimed_levels', [])

        # Verify the new fields are maintained
        self.assertEqual(updated_battlepass.get('current_level'), initial_battlepass.get('current_level') + 1)
        self.assertEqual(updated_battlepass.get('unlocked_levels'), [Decimal(1), Decimal(2), Decimal(3), Decimal(4)])
        self.assertEqual(updated_battlepass.get('locked_levels'), [Decimal(5), Decimal(6)])

        # Check if the coins have been updated correctly
        expected_coins = initial_coins + self.active_battlepass['levels'][1]['coins']
        self.assertEqual(updated_coins, expected_coins)

        # Check if claimed_levels was properly updated
        expected_claimed_levels = initial_claimed_levels + [2]
        self.assertCountEqual(updated_claimed_levels, expected_claimed_levels)


    def test_not_enough_xp(self):
        """
        Test response when the user does not have enough XP to claim a level.
        """
        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

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
        self.assertEqual(body['message'], "Not enough XP to claim this level")


    def test_level_not_unlocked(self):
        """
        Test response when the battlepass level is not unlocked.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        request_query = {
            "battlepass_level": "4"  # Level 4 should be in locked_levels
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
        self.assertEqual(body['message'], "Battlepass level 4 is not unlocked.")


    def tearDown(self):
        self.users_resource_patcher.stop()
        self.battlepass_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path