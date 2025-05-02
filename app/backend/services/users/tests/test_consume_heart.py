import json
import sys
import os
import unittest
from unittest.mock import patch
from datetime import datetime, timedelta, timezone
from base_test_setup import BaseTestSetup


original_path = sys.path.copy()
BaseTestSetup.setup_paths('consumeHeart')
BaseTestSetup.clear_module_cache(['common', 'consumeHeart.app'])


from base_test_setup import BaseTestSetup
from moto import mock_aws
from consumeHeart.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestConsumeHeart(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.users_resource_patcher = patch('consumeHeart.app._LAMBDA_USERS_TABLE_RESOURCE', {
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


    def test_consume_heart_successfully(self):
        """
        Test that a heart is successfully consumed for a user
        """
        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        event = {
            'headers': {'Authorization': jwt_token}
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)
        self.assertIn("data", body)
        self.assertIn("Heart consumed successfully", body['message'])

        hearts_next_refill_str = body['data']['hearts_next_refill']
        self.assertIsNotNone(hearts_next_refill_str)

        # Parse and verify the refill time is approximately 3 hours in the future
        hearts_next_refill = datetime.fromisoformat(hearts_next_refill_str)
        expected_time = datetime.now(timezone.utc) + timedelta(hours=3)
        time_difference = abs((hearts_next_refill - expected_time).total_seconds())

        # Allow a small tolerance (5 seconds) for test execution time
        self.assertLess(time_difference, 5,
                        f"hearts_next_refill time {hearts_next_refill} should be about 3 hours from now")

        result = self.users_table.get_item(Key={"email": "test@mail.com"})
        user = result.get('Item', {})

        self.assertEqual(user.get("hearts"), 4)
        self.assertIsNotNone(body['data']['hearts_next_refill'])
        self.assertIn('hearts_next_refill', user)


    def test_when_user_has_no_hearts(self):
        """
        Test response when user has no hearts left.
        """
        self.sample_user["hearts"] = 0
        self.users_table.put_item(Item=self.sample_user)
        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {
                'Authorization': jwt_token
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 400)
        self.assertIn("message", body)
        self.assertIn("Unable to consume a heart as they have no hearts left.", body['message'])

    def tearDown(self):
        self.users_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path
