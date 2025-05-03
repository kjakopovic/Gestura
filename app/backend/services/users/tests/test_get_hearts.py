import json
import sys
import os
import unittest
from unittest.mock import patch
from datetime import datetime, timedelta, timezone

from base_test_setup import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('getHearts')
BaseTestSetup.clear_module_cache(['common', 'getHearts.app'])

from moto import mock_aws
from getHearts.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestGetHearts(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.users_resource_patcher = patch('getHearts.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.users_resource_patcher.start()


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


    def test_when_user_not_found(self):
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


    def test_get_hearts_with_full_hearts(self):
        """
        Test getting hearts when user has maximum hearts.
        """
        # Ensure user has full hearts
        self.sample_user["hearts"] = 5
        self.sample_user["hearts_next_refill"] = None
        self.users_table.put_item(Item=self.sample_user)

        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {'Authorization': jwt_token}
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)
        self.assertIn("data", body)
        self.assertEqual(body['message'], "Fetched hearts successfully")
        self.assertEqual(body['data']['hearts'], 5)
        self.assertIsNone(body['data']['hearts_next_refill'])


    def test_get_hearts_with_partial_hearts_before_refill(self):
        """
        Test getting hearts when user has some hearts and refill time is in the future.
        """
        # Set user with partial hearts and future refill time
        refill_time = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

        self.sample_user["hearts"] = 3
        self.sample_user["hearts_next_refill"] = refill_time
        self.users_table.put_item(Item=self.sample_user)

        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {'Authorization': jwt_token}
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)
        self.assertIn("data", body)
        self.assertEqual(body['data']['hearts'], 3)
        self.assertEqual(body['data']['hearts_next_refill'], refill_time)


    def test_get_hearts_with_partial_refill(self):
        """
        Test getting hearts when some hearts should be refilled due to passed time.
        """
        # Set user with partial hearts and refill time in the past (3 hours ago)
        past_refill_time = (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()

        self.sample_user["hearts"] = 2
        self.sample_user["hearts_next_refill"] = past_refill_time
        self.users_table.put_item(Item=self.sample_user)

        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {'Authorization': jwt_token}
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)
        self.assertIn("data", body)
        # Should have refilled 1 heart (1 per 3 hours)
        self.assertEqual(body['data']['hearts'], 4)
        # Next refill should be around 3 hours after the original refill time
        self.assertIsNotNone(body['data']['hearts_next_refill'])

        # Verify hearts were updated in database
        users_table = self.dynamodb.Table(os.environ["USERS_TABLE_NAME"])
        result = users_table.get_item(Key={"email": "test@mail.com"})
        user = result.get('Item', {})

        self.assertEqual(user.get("hearts"), 4)


    def test_get_hearts_with_full_refill(self):
        """
        Test getting hearts when all hearts should be refilled due to passed time.
        """
        # Set user with low hearts and refill time way in the past (15+ hours ago)
        past_refill_time = (datetime.now() - timedelta(hours=15)).isoformat()

        self.sample_user["hearts"] = 0
        self.sample_user["hearts_next_refill"] = past_refill_time
        self.users_table.put_item(Item=self.sample_user)

        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {'Authorization': jwt_token}
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)
        self.assertIn("data", body)
        # Should have refilled to max hearts (5)
        self.assertEqual(body['data']['hearts'], 5)
        # No next refill time when hearts are full
        self.assertIsNone(body['data']['hearts_next_refill'])

        # Verify hearts were updated in database
        result = self.users_table.get_item(Key={"email": "test@mail.com"})
        user = result.get('Item', {})

        self.assertEqual(user.get("hearts"), 5)
        self.assertIsNone(user.get("hearts_next_refill"))


    def test_get_hearts_with_invalid_refill_format(self):
        """
        Test getting hearts when the refill time has an invalid format.
        """
        self.sample_user["hearts"] = 3
        self.sample_user["hearts_next_refill"] = "invalid-time-format"
        self.users_table.put_item(Item=self.sample_user)

        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {'Authorization': jwt_token}
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200, "Should handle invalid format gracefully")
        self.assertIn("message", body)
        self.assertIn("data", body)
        # Hearts should stay the same
        self.assertEqual(body['data']['hearts'], 4)
        # Should have a new valid refill time
        self.assertIsNotNone(body['data']['hearts_next_refill'])


    def tearDown(self):
        self.users_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path
