import json
import sys
import os
import unittest
from unittest.mock import patch
from base_test_setup import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('completeLevel')
BaseTestSetup.clear_module_cache(['validation_schema', 'common', 'completeLevel.app'])

from moto import mock_aws
from completeLevel.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestCompleteLevel(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.users_resource_patcher = patch('completeLevel.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.languages_resource_patcher = patch('completeLevel.app._LAMBDA_LANGUAGES_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["LANGUAGES_TABLE_NAME"]
        })
        self.battlepass_resource_patcher = patch('completeLevel.app._LAMBDA_BATTLEPASS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["BATTLEPASS_TABLE_NAME"]
        })

        self.battlepass_resource_patcher.start()
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


    def test_validation_schema(self):
        """
        Test validation schema for the request body.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        test_cases = [
            {
                "request_body": {},
                "expected_validation_message": "data must contain ['correct_answers_versions', 'finished_at', 'language_id', 'letters_learned', 'started_at'] properties"
            },
            {
                "request_body": {
                    "started_at": "2023-10-01T12:00:00Z",
                    "finished_at": "2023-10-01T12:30:00Z",
                    "language_id": "en",
                    "letters_learned": ["A", "B", "C"]
                    # Missing correct_answers_versions
                },
                "expected_validation_message": "data must contain ['correct_answers_versions'] properties"
            },
            {
                "request_body": {
                    "correct_answers_versions": [1, 2, 3],
                    "finished_at": "2023-10-01T12:30:00Z",
                    "language_id": "en",
                    "letters_learned": ["A", "B", "C"]
                    # Missing started_at
                },
                "expected_validation_message": "data must contain ['started_at'] properties"
            },
            {
                "request_body": {
                    "correct_answers_versions": [1, 2, 3],
                    "started_at": "2023-10-01T12:00:00Z",
                    "language_id": "en",
                    "letters_learned": ["A", "B", "C"]
                    # Missing finished_at
                },
                "expected_validation_message": "data must contain ['finished_at'] properties"
            },
            {
                "request_body": {
                    "correct_answers_versions": [1, 2, 3],
                    "started_at": "2023-10-01T12:00:00Z",
                    "finished_at": "2023-10-01T12:30:00Z",
                    "letters_learned": ["A", "B", "C"]
                    # Missing language_id
                },
                "expected_validation_message": "data must contain ['language_id'] properties"
            },
            {
                "request_body": {
                    "correct_answers_versions": [1, 2, 3],
                    "started_at": "2023-10-01T12:00:00Z",
                    "finished_at": "2023-10-01T12:30:00Z",
                    "language_id": "en"
                    # Missing letters_learned
                },
                "expected_validation_message": "data must contain ['letters_learned'] properties"
            },
            {
                "request_body": {
                    "correct_answers_versions": "not an array",
                    "started_at": "2023-10-01T12:00:00Z",
                    "finished_at": "2023-10-01T12:30:00Z",
                    "language_id": "en",
                    "letters_learned": ["A", "B", "C"]
                },
                "expected_validation_message": "data.correct_answers_versions must be array"
            },
            {
                "request_body": {
                    "correct_answers_versions": [],
                    "started_at": "2023-10-01T12:00:00Z",
                    "finished_at": "2023-10-01T12:30:00Z",
                    "language_id": "en",
                    "letters_learned": ["A", "B", "C"]
                },
                "expected_validation_message": "data.correct_answers_versions must contain at least 1 items"
            },
            {
                "request_body": {
                    "correct_answers_versions": [4],
                    "started_at": "2023-10-01T12:00:00Z",
                    "finished_at": "2023-10-01T12:30:00Z",
                    "language_id": "en",
                    "letters_learned": ["A", "B", "C"]
                },
                "expected_validation_message": "data.correct_answers_versions[0] must be one of [1, 2, 3]"
            },
            {
                "request_body": {
                    "correct_answers_versions": [1, 2, 3],
                    "started_at": "invalid-date-format",
                    "finished_at": "2023-10-01T12:30:00Z",
                    "language_id": "en",
                    "letters_learned": ["A", "B", "C"]
                },
                "expected_validation_message": "data.started_at must match pattern"
            },
            {
                "request_body": {
                    "correct_answers_versions": [1, 2, 3],
                    "started_at": "2023-10-01T12:00:00Z",
                    "finished_at": "invalid-date-format",
                    "language_id": "en",
                    "letters_learned": ["A", "B", "C"]
                },
                "expected_validation_message": "data.finished_at must match pattern"
            },
            {
                "request_body": {
                    "correct_answers_versions": [1, 2, 3],
                    "started_at": "2023-10-01T12:00:00Z",
                    "finished_at": "2023-10-01T12:30:00Z",
                    "language_id": 123,
                    "letters_learned": ["A", "B", "C"]
                },
                "expected_validation_message": "data.language_id must be string"
            },
            {
                "request_body": {
                    "correct_answers_versions": [1, 2, 3],
                    "started_at": "2023-10-01T12:00:00Z",
                    "finished_at": "2023-10-01T12:30:00Z",
                    "language_id": "en",
                    "letters_learned": []
                },
                "expected_validation_message": "data.letters_learned must contain at least 1 items"
            },
            {
                "request_body": {
                    "correct_answers_versions": [1, 2, 3],
                    "started_at": "2023-10-01T12:00:00Z",
                    "finished_at": "2023-10-01T12:30:00Z",
                    "language_id": "en",
                    "letters_learned": ["A", "B", "C"],
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
                self.assertIn(case["expected_validation_message"], body['message'])


    def test_complete_level_successfully(self):
        """
        Test successful level completion.
        """
        from decimal import Decimal
        import random

        original_uniform = random.uniform
        random.uniform = lambda a, b: 1.5

        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        initial_user = self.users_table.get_item(Key={'email': email})['Item']
        initial_xp = Decimal(str(initial_user['xp']))
        initial_coins = Decimal(str(initial_user['coins']))
        initial_current_level = initial_user.get('current_level', {})

        print(f"User: {initial_user}")

        # Define versions for correct answers
        versions = [1, 2, 3]

        body_data = {
            "correct_answers_versions": versions,
            "started_at": "2023-10-01T12:00:00Z",
            "finished_at": "2023-10-01T12:30:00Z",
            "language_id": "en",
            "letters_learned": ["A", "B", "C"]
        }

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "body": json.dumps(body_data)
        }

        response = lambda_handler(event, {})

        random.uniform = original_uniform

        if response['statusCode'] != 200:
            print(f"Response status code: {response['statusCode']}")
            print(f"Response body: {response['body']}")

        body = json.loads(response['body'])
        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)

        self.assertEqual(body['message'], "Level completed successfully")

        updated_user = self.users_table.get_item(Key={'email': email})['Item']

        current_level = updated_user.get('current_level', {})
        print(f"Initial current level: {initial_current_level}, Updated current level: {current_level}")

        # If the initial level doesn't exist, the Lambda sets it to 1+1=2
        expected_level = 2
        updated_lang_level = current_level.get("en", 0)

        self.assertEqual(updated_lang_level, expected_level,
                         f"Expected level to be {expected_level}, got {updated_lang_level}")

        updated_xp = Decimal(str(updated_user['xp']))
        updated_coins = Decimal(str(updated_user['coins']))
        print(f"Updated user state - XP: {updated_xp}, Coins: {updated_coins}")
        print(f"XP difference: {updated_xp - initial_xp}, Coins difference: {updated_coins - initial_coins}")

        # Calculate expected rewards based on the actual algorithm
        xp_map = {1: 2, 2: 3, 3: 5}
        expected_xp_increase = sum(xp_map.get(v, 0) for v in versions)
        print(f"Expected XP increase: {expected_xp_increase} = {' + '.join([f'{xp_map.get(v, 0)}' for v in versions])}")

        expected_xp = initial_xp + Decimal(str(expected_xp_increase))
        expected_coins = initial_coins + Decimal(str(int(expected_xp_increase * 1.5)))
        print(f"Expected final values - XP: {expected_xp}, Coins: {expected_coins}")

        self.assertEqual(updated_xp, expected_xp,
                         f"Expected XP to be {expected_xp}, got {updated_xp}")
        self.assertEqual(updated_coins, expected_coins,
                         f"Expected coins to be {expected_coins}, got {updated_coins}")


    def test_no_current_level(self):
        """
        Test when the user has no current level for given language.
        """
        from decimal import Decimal

        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        initial_user = self.users_table.get_item(Key={'email': email})['Item']
        initial_current_level = initial_user.get('current_level', {})

        # Define versions for correct answers
        versions = [1, 2, 3]

        body_data = {
            "correct_answers_versions": versions,
            "started_at": "2023-10-01T12:00:00Z",
            "finished_at": "2023-10-01T12:30:00Z",
            "language_id": "de",
            "letters_learned": ["A", "B", "C"]
        }

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "body": json.dumps(body_data)
        }

        response = lambda_handler(event, {})

        if response['statusCode'] != 200:
            print(f"Response status code: {response['statusCode']}")
            print(f"Response body: {response['body']}")

        body = json.loads(response['body'])
        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)

        self.assertEqual(body['message'], "Level completed successfully")

        # Get updated user data
        updated_user = self.users_table.get_item(Key={'email': email})['Item']
        updated_current_level = updated_user.get('current_level', {})

        # Check that the new language was added
        self.assertIn('de', updated_current_level, "The German language level should be added")
        self.assertEqual(updated_current_level['de'], 2, "The German language level should be 2")

        # Check that existing languages were preserved
        self.assertEqual(len(updated_current_level), len(initial_current_level) + 1,
                         "Should have added exactly one language")

        # Check that all original languages are still there with same levels
        for lang_id, level in initial_current_level.items():
            self.assertIn(lang_id, updated_current_level, f"Language {lang_id} should be preserved")
            self.assertEqual(updated_current_level[lang_id], level,
                             f"Level for {lang_id} should not change")


    def test_complete_level_no_active_battlepass(self):
        """
        Test level completion when there's no active battlepass.
        """
        from decimal import Decimal

        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        # Get the initial user state
        initial_user = self.users_table.get_item(Key={'email': email})['Item']
        initial_xp = Decimal(str(initial_user.get('xp', 0)))
        initial_coins = Decimal(str(initial_user.get('coins', 0)))
        initial_battlepass_xp = initial_user.get('battlepass_xp', [])

        # Store the initial battlepass seasons to restore later
        original_battlepass_items = self._scan_table(self.battlepass_table)

        # Clear the battlepass table to simulate no active battlepasses
        for item in original_battlepass_items:
            self.battlepass_table.delete_item(Key={'season': item['season']})

        # Define versions for correct answers
        versions = [1, 2, 3]

        body_data = {
            "correct_answers_versions": versions,
            "started_at": "2023-10-01T12:00:00Z",
            "finished_at": "2023-10-01T12:30:00Z",
            "language_id": "en",
            "letters_learned": ["A", "B", "C"]
        }

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "body": json.dumps(body_data)
        }

        # Call the lambda handler
        response = lambda_handler(event, {})

        # Restore the original battlepass seasons
        for item in original_battlepass_items:
            self.battlepass_table.put_item(Item=item)

        # Verify the response
        body = json.loads(response['body'])
        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "Level completed successfully")

        # Get the updated user
        updated_user = self.users_table.get_item(Key={'email': email})['Item']
        updated_xp = Decimal(str(updated_user.get('xp', 0)))
        updated_coins = Decimal(str(updated_user.get('coins', 0)))
        updated_battlepass_xp = updated_user.get('battlepass_xp', [])

        # Verify XP and coins were awarded correctly
        xp_map = {1: 2, 2: 3, 3: 5}
        expected_xp_increase = sum(xp_map.get(v, 0) for v in versions)
        expected_xp = initial_xp + Decimal(str(expected_xp_increase))

        self.assertEqual(updated_xp, expected_xp,
                         f"Expected XP to be {expected_xp}, got {updated_xp}")
        self.assertTrue(updated_coins > initial_coins,
                        "Coins should increase after completing a level")

        # Verify battlepass_xp array was preserved but not modified
        self.assertEqual(updated_battlepass_xp, initial_battlepass_xp,
                         "Battlepass XP should remain unchanged when no active battlepass")

    def _scan_table(self, table):
        """Helper method to scan entire table contents."""
        response = table.scan()
        return response.get('Items', [])


    def tearDown(self):
        self.users_resource_patcher.stop()
        self.languages_resource_patcher.stop()
        self.battlepass_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path