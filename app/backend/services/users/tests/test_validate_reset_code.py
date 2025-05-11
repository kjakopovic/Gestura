import json
import sys
import os
import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from base_test_setup import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('validateResetCode')
BaseTestSetup.clear_module_cache(['validation_schema', 'common', 'validateResetCode.app'])

from moto import mock_aws
from validateResetCode.app import lambda_handler


@mock_aws
class TestValidateResetCode(BaseTestSetup):
    def setUp(self):
        super().setUp()

        self.resource_patcher = patch('validateResetCode.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.table = self.dynamodb.Table(os.environ["USERS_TABLE_NAME"])
        self.resource_patcher.start()


    def test_validation_schema(self):
        """
        Test response when validation schema is not satisfied.
        """
        test_cases = [
            {
                "request_body": {
                    "email": "test@mail.com"
                },
                "expected_validation_message": "data must contain ['code'] properties"
            },
            {
                "request_body": {
                    "code": "123456"
                },
                "expected_validation_message": "data must contain ['email'] properties"
            },
            {
                "request_body": {
                    "email": "invalid-email",
                    "code": "123456"
                },
                "expected_validation_message": "data.email must be email"
            },
            {
                "request_body": {
                    "email": "test@mail.com",
                    "code": "12345"  # Too short
                },
                "expected_validation_message": "data.code must be longer than or equal to 6 characters"
            },
            {
                "request_body": {
                    "email": "test@mail.com",
                    "code": "1234567"  # Too long
                },
                "expected_validation_message": "data.code must be shorter than or equal to 6 characters"
            },
            {
                "request_body": {
                    "email": "test@mail.com",
                    "code": "123456",
                    "extraField": "value"
                },
                "expected_validation_message": "data must not contain {'extraField'} properties"
            }
        ]

        for case in test_cases:
            with self.subTest(request_body=case["request_body"],
                              expected_validation_message=case["expected_validation_message"]):
                event = {"body": json.dumps(case["request_body"])}

                response = lambda_handler(event, {})
                body = json.loads(response['body'])

                self.assertEqual(response['statusCode'], 400)
                self.assertIn(case["expected_validation_message"], body['message'])

    def test_successful_validation(self):
        """
        Test successful validation of a valid reset code.
        """
        email = "test@mail.com"
        reset_code = "123456"

        current_time = int(datetime.now(timezone.utc).timestamp())
        expiration_time = current_time + 600

        self.table.put_item(Item={
            'email': email,
            'reset_code': reset_code,
            'code_expiration_time': expiration_time
        })

        # Verify that code and time were added correctly
        initial_user = self.table.get_item(Key={'email': email})['Item']
        self.assertEqual(initial_user['reset_code'], reset_code)
        self.assertEqual(initial_user['code_expiration_time'], expiration_time)

        # Call the lambda function
        event = {"body": json.dumps({
            "email": email,
            "code": reset_code
        })}

        response = lambda_handler(event, {})

        # Check for the response
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertIn('message', body)

        # Verify code is still present (modified expectation)
        updated_user = self.table.get_item(Key={'email': email})['Item']
        self.assertEqual(updated_user['reset_code'], reset_code)
        self.assertEqual(updated_user['code_expiration_time'], expiration_time)

    def test_incorrect_reset_code(self):
        """
        Test rejection of an incorrect reset code.
        """
        email = "test@mail.com"
        reset_code = "123456"
        wrong_code = "654321"
        current_time = int(datetime.now(timezone.utc).timestamp())
        expiration_time = current_time + 600

        self.table.put_item(Item={
            'email': email,
            'reset_code': reset_code,
            'code_expiration_time': expiration_time
        })

        # Test with incorrect code
        event = {"body": json.dumps({
            "email": email,
            "code": wrong_code
        })}

        response = lambda_handler(event, {})

        self.assertEqual(response['statusCode'], 400)
        body = json.loads(response['body'])
        self.assertIn('message', body)
        self.assertEqual(body['message'], "Invalid reset code")


    def test_expired_reset_code(self):
        """
        Test rejection of an expired reset code.
        """
        email = "test@mail.com"
        reset_code = "123456"
        current_time = int(datetime.now(timezone.utc).timestamp())
        expiration_time = current_time - 700

        self.table.put_item(Item={
            'email': email,
            'reset_code': reset_code,
            'code_expiration_time': expiration_time
        })

        event = {"body": json.dumps({
            "email": email,
            "code": reset_code
        })}

        response = lambda_handler(event, {})

        self.assertEqual(response['statusCode'], 400)
        body = json.loads(response['body'])
        self.assertIn('message', body)
        self.assertEqual(body['message'], "Reset code has expired")


    def tearDown(self):
        self.resource_patcher.stop()
        super().tearDown()

if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path