import json
import sys
import os
import unittest
import random
from decimal import Decimal
from unittest.mock import patch
from base_test_setup import BaseTestSetup
from datetime import datetime, timezone, timedelta


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
        self.achievements_resource_patcher = patch('completeLevel.app._LAMBDA_ACHIEVEMENTS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["ACHIEVEMENTS_TABLE_NAME"]
        })

        self.battlepass_resource_patcher.start()
        self.users_resource_patcher.start()
        self.languages_resource_patcher.start()
        self.achievements_resource_patcher.start()


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


    def test_complete_level_with_xp_multiplier(self):
        """
        Test level completion with an active battlepass that has an XP multiplier.
        """
        # Fix random.uniform to return consistent value for testing
        original_uniform = random.uniform
        random.uniform = lambda a, b: 1.5

        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        # Get initial user state
        initial_user = self.users_table.get_item(Key={'email': email})['Item']
        initial_xp = Decimal(str(initial_user.get('xp', 0)))
        initial_coins = Decimal(str(initial_user.get('coins', 0)))

        # Create and add active XP multiplier to user
        current_time = datetime.now(timezone.utc)
        expiry_time = current_time + timedelta(hours=1)

        xp_multiplier_item = {
            "category": "xp_boost",
            "effects": {
                "multiplier": Decimal('2.0')  # 2x multiplier
            },
            "expires_at": expiry_time.isoformat()
        }

        # Update user with active item
        self.users_table.update_item(
            Key={'email': email},
            UpdateExpression="SET activated_items = :items",
            ExpressionAttributeValues={
                ':items': [xp_multiplier_item]
            }
        )

        # Define level completion request
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

        # Complete level
        response = lambda_handler(event, {})

        # Restore random function
        random.uniform = original_uniform

        # Verify response
        body = json.loads(response['body'])
        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "Level completed successfully")

        # Get updated user
        updated_user = self.users_table.get_item(Key={'email': email})['Item']
        updated_xp = Decimal(str(updated_user.get('xp', 0)))
        updated_coins = Decimal(str(updated_user.get('coins', 0)))

        # Calculate expected rewards based on the algorithm with multiplier
        xp_map = {1: 2, 2: 3, 3: 5}
        base_xp_increase = sum(xp_map.get(v, 0) for v in versions)
        multiplier = Decimal('2.0')

        expected_xp_increase = base_xp_increase * multiplier
        expected_xp = initial_xp + expected_xp_increase
        expected_coins = initial_coins + Decimal(str(int(base_xp_increase * 1.5)))

        print(f"Base XP: {base_xp_increase}, Multiplier: {multiplier}")
        print(f"Expected XP increase: {expected_xp_increase}")
        print(f"Initial XP: {initial_xp}, Expected final XP: {expected_xp}, Actual: {updated_xp}")

        self.assertEqual(updated_xp, expected_xp,
                         f"Expected XP to be {expected_xp} (base {base_xp_increase} × multiplier {multiplier}), got {updated_xp}")
        self.assertEqual(updated_coins, expected_coins,
                         f"Expected coins to be {expected_coins}, got {updated_coins}")


    def test_complete_level_with_active_battlepass(self):
        """
        Test level completion when there's an active battlepass (no XP multiplier).
        """
        # Fix random.uniform to return consistent value for testing
        original_uniform = random.uniform
        random.uniform = lambda a, b: 1.5

        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        # Get initial user state
        initial_user = self.users_table.get_item(Key={'email': email})['Item']
        initial_xp = Decimal(str(initial_user.get('xp', 0)))
        initial_coins = Decimal(str(initial_user.get('coins', 0)))
        initial_battlepass = initial_user.get('battlepass', {})

        print(f"INITIAL STATE:")
        print(f"Initial XP: {initial_xp}, Initial Coins: {initial_coins}")
        print(f"Initial battlepass: {json.dumps(initial_battlepass, default=str)}")

        # Make sure user has no active items
        self.users_table.update_item(
            Key={'email': email},
            UpdateExpression="REMOVE activated_items"
        )

        # Update the battlepass end date to ensure it's active
        active_season = "1"
        current_date = datetime.now(timezone.utc)
        future_date = current_date + timedelta(days=30)

        print(f"Setting battlepass season {active_season} as active:")
        print(f"  Start date: {(current_date - timedelta(days=1)).isoformat()}")
        print(f"  End date: {future_date.isoformat()}")

        self.battlepass_table.update_item(
            Key={'season': active_season},
            UpdateExpression="SET start_date = :start, end_date = :end",
            ExpressionAttributeValues={
                ':start': (current_date - timedelta(days=1)).isoformat(),
                ':end': future_date.isoformat()
            }
        )

        # Verify there's an active battlepass
        active_battlepass = self.battlepass_table.get_item(Key={'season': active_season})['Item']
        self.assertIsNotNone(active_battlepass, "Battlepass should exist")
        print(f"Active battlepass: {json.dumps(active_battlepass, default=str)}")

        start_date = datetime.fromisoformat(active_battlepass['start_date'].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(active_battlepass['end_date'].replace('Z', '+00:00'))
        is_active = start_date < current_date < end_date
        print(
            f"Battlepass active: {is_active} (Current: {current_date.isoformat()}, Start: {start_date.isoformat()}, End: {end_date.isoformat()})")

        self.assertTrue(is_active,
                        f"Current date {current_date} should be between start {start_date} and end {end_date}")

        # Define level completion request
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

        print(f"Completing level with versions: {versions}")

        # Complete level
        response = lambda_handler(event, {})
        random.uniform = original_uniform

        # Verify response
        body = json.loads(response['body'])
        print(f"Response: {json.dumps(body, default=str)}")
        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "Level completed successfully")

        # Get updated user
        updated_user = self.users_table.get_item(Key={'email': email})['Item']
        updated_xp = Decimal(str(updated_user.get('xp', 0)))
        updated_coins = Decimal(str(updated_user.get('coins', 0)))
        updated_battlepass = updated_user.get('battlepass', {})

        print(f"\nUPDATED STATE:")
        print(f"Updated XP: {updated_xp}, Updated Coins: {updated_coins}")
        print(f"Updated battlepass: {json.dumps(updated_battlepass, default=str)}")

        # Calculate expected rewards
        xp_map = {1: 2, 2: 3, 3: 5}
        base_xp_increase = sum(xp_map.get(v, 0) for v in versions)
        expected_xp = initial_xp + base_xp_increase
        expected_coins = initial_coins + Decimal(str(int(base_xp_increase * 1.5)))

        print(f"\nEXPECTED CHANGES:")
        print(f"Base XP increase: {base_xp_increase} (from versions {versions})")
        print(f"Expected total XP: {expected_xp}, Expected total coins: {expected_coins}")

        # Verify XP and coins were awarded correctly
        self.assertEqual(updated_xp, expected_xp,
                         f"Expected XP to be {expected_xp}, got {updated_xp}")
        self.assertEqual(updated_coins, expected_coins,
                         f"Expected coins to be {expected_coins}, got {updated_coins}")

        # Verify battlepass structure exists
        self.assertIsNotNone(updated_battlepass, "User should have a battlepass object")

        # Verify the active season entry exists
        self.assertIn(active_season, updated_battlepass,
                      f"Battlepass should have an entry for active season {active_season}")

        # Get initial XP for the season (0 if not previously set)
        initial_season_xp = Decimal('0')
        if active_season in initial_battlepass:
            initial_season_xp = Decimal(str(initial_battlepass[active_season].get('xp', 0)))

        print(f"Initial battlepass XP for season {active_season}: {initial_season_xp}")

        # Calculate expected battlepass XP
        expected_bp_xp = initial_season_xp + base_xp_increase
        print(f"Expected battlepass XP: {expected_bp_xp} (initial {initial_season_xp} + increase {base_xp_increase})")

        # Verify the battlepass XP was increased correctly
        actual_bp_xp = Decimal(str(updated_battlepass[active_season].get('xp', 0)))
        print(f"Actual battlepass XP: {actual_bp_xp}")

        self.assertEqual(actual_bp_xp, expected_bp_xp,
                         f"Battlepass XP should be {expected_bp_xp}, got {actual_bp_xp}")

        # Verify XP was actually increased
        self.assertTrue(actual_bp_xp > initial_season_xp,
                        f"Battlepass XP should increase from {initial_season_xp} to {actual_bp_xp}")

        # Verify the claimed_levels array exists
        self.assertIn('claimed_levels', updated_battlepass[active_season],
                      "Battlepass entry should have a claimed_levels array")
        print(f"Claimed levels array: {updated_battlepass[active_season].get('claimed_levels', [])}")


    def test_with_new_achievement(self):
        """
        Test level completion where a user gets a new achievement.
        """
        self.sample_achievement = {
            "id": "new_achievement",
            "type": "xp",
            "name": "New Achievement",
            "description": "You have completed a new achievement.",
            "icon": "https://example.com/icon.png",
            "requires": 1
        }
        self.achievements_table.put_item(Item=self.sample_achievement)

        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        # Get initial user state
        initial_user = self.users_table.get_item(Key={'email': email})['Item']

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "body": json.dumps({
                "correct_answers_versions": [1, 2, 3],
                "started_at": "2023-10-01T12:00:00Z",
                "finished_at": "2023-10-01T12:30:00Z",
                "language_id": "en",
                "letters_learned": ["A", "B", "C"]
            })
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "Level completed successfully")
        self.assertIn("new_achievement", body['new_achievements'], "User should have received the new achievement")
        updated_user = self.users_table.get_item(Key={'email': email})['Item']

        # Check if the new achievement is in the user's achievements
        user_achievements = updated_user.get('achievements', [])
        self.assertIn("new_achievement", user_achievements, "User should have the new achievement")
        self.assertEqual(len(user_achievements), len(initial_user.get('achievements', [])) + 1,
                         "User should have one more achievement after completion")

        print(f"User achievements after completion: {user_achievements}")


    def test_with_achievements(self):
        """
        Test response when user gets a new achievement while having existing ones.
        """
        self.sample_achievements = [
            {
                "id": "new_achievement",
                "type": "xp",
                "requires": 1
            },
            {
                "id": "existing_achievement",
                "type": "xp",
                "requires": 0
            },
            {
                "id": "random_achievement",
                "type": "xp",
                "requires": 20
            },
            {
                "id": "high_xp_achievement",
                "type": "xp",
                "requires": 10000
            },
            {
                "id": "time_played_achievement",
                "type": "time_played",
                "requires": 500
            },
            {
                "id": "time_played_achievement_2",
                "type": "time_played",
                "requires": 1000
            },
            {
                "id": "time_played_achievement_3",
                "type": "time_played",
                "requires": 7000
            },
            {
                "id": "level_achievement",
                "type": "level",
                "requires": 1
            },
            {
                "id": "level_achievement_2",
                "type": "level",
                "requires": 2
            },
            {
                "id": "level_achievement_3",
                "type": "level",
                "requires": 3
            },
            {
                "id": "no_time_played_achievement",
                "type": "time_played",
                "requires": 0
            }
        ]
        for achievement in self.sample_achievements:
            self.achievements_table.put_item(Item=achievement)

        self.achievements_user = {
            "email": "achievement@mail.com",
            "time_played": 20,
            "xp": 10,
            "current_level": {
                "en": 2,
                "de": 1
            },
            "achievements": [
                "existing_achievement",
                "level_achievement",
                "no_time_played_achievement"
            ],
            "letters_learned": {},
        }
        self.users_table.put_item(Item=self.achievements_user)

        jwt_token = generate_jwt_token("achievement@mail.com")

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "body": json.dumps({
                "correct_answers_versions": [1, 2, 3],
                "started_at": "2023-10-01T12:00:00Z",
                "finished_at": "2023-10-01T12:30:00Z",
                "language_id": "en",
                "letters_learned": ["A", "B", "C"]
            })
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "Level completed successfully")
        self.assertIn("new_achievements", body, "Response should contain new achievements")
        self.assertIn("new_achievement", body['new_achievements'], "User should have received the new achievement")
        self.assertIn("level_achievement_2", body['new_achievements'], "User should have received the new achievement")
        self.assertIn("time_played_achievement", body['new_achievements'], "User should have received the new achievement")
        self.assertIn("time_played_achievement_2", body['new_achievements'], "User should have received the new achievement")

        updated_user = self.users_table.get_item(Key={'email': "achievement@mail.com"})['Item']
        user_achievements = updated_user.get('achievements', [])

        print(f"\nUser achievements before: {self.achievements_user.get('achievements')}")
        print(f"\nUser achievements after completion: {user_achievements}")
        print(f"\nNew achievements: {body['new_achievements']}")


    def _scan_table(self, table):
        """Helper method to scan entire table contents."""
        response = table.scan()
        return response.get('Items', [])


    def tearDown(self):
        self.users_resource_patcher.stop()
        self.languages_resource_patcher.stop()
        self.battlepass_resource_patcher.stop()
        self.achievements_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path