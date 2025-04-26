import json
import sys
import os
import unittest
from unittest.mock import patch
from datetime import datetime, timezone

from base_test_setup import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('forgotPasswordRequest')
BaseTestSetup.clear_module_cache(['validation_schema', 'common', 'forgotPasswordRequest.app'])

from moto import mock_aws
from forgotPasswordRequest.app import lambda_handler


@mock_aws
class TestForgotPassword(BaseTestSetup):
    def setUp(self):
        super().setUp()

        self.resource_patcher = patch('forgotPasswordRequest.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.resource_patcher.start()

        # Mock SES client
        self.ses_patcher = patch('forgotPasswordRequest.app.client')
        self.mock_ses = self.ses_patcher.start()
        self.mock_ses.send_email.return_value = {'MessageId': 'test-message-id'}

        # Set source email
        os.environ['SOURCE_EMAIL'] = 'nolanilisic@gmail.com'


    def test_request_for_non_existent_user(self):
        """
        Test forgot password request for a non-existent user.
        """
        event = {
            "body": json.dumps({
                "email": "nonexistent@example.com"
            })
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(body['message'], "User does not exist.")

        self.mock_ses.send_email.assert_not_called()


    def test_request_successful(self):
        """
        Test successful forgot password request.
        """
        event = {
            "body": json.dumps({
                "email": "test@mail.com"  # This user exists from BaseTestSetup
            })
        }

        # Mock the random code generation for predictable testing
        with patch('forgotPasswordRequest.app.generate_code', return_value="123456"):
            response = lambda_handler(event, {})
            body = json.loads(response['body'])

            # Verify the response is successful
            self.assertEqual(response['statusCode'], 200)
            self.assertEqual(body['message'], "Reset code sent to email")

            # Verify SES was called with your verified email
            self.mock_ses.send_email.assert_called_once()
            email_args = self.mock_ses.send_email.call_args[1]
            self.assertEqual(email_args['Destination']['ToAddresses'][0], "test@mail.com")
            self.assertEqual(email_args['Source'], 'nolanilisic@gmail.com')
            self.assertIn("123456", email_args['Message']['Body']['Text']['Data'])

            # Verify the code was saved correctly
            user = self.dynamodb.Table(os.environ["USERS_TABLE_NAME"]).get_item(Key={"email": "test@mail.com"})
            self.assertIn("Item", user)
            self.assertIn("reset_code", user["Item"])
            self.assertEqual(user["Item"]["reset_code"], "123456")

            # Verify expiration time is within expected range
            current_time = int(datetime.now(timezone.utc).timestamp())
            expiration_time = user["Item"]["code_expiration_time"]
            self.assertTrue(expiration_time > current_time)
            self.assertTrue(expiration_time <= current_time + 600)


    def test_invalid_email_format(self):
        """
        Test forgot password request with invalid email format.
        """
        event = {
            "body": json.dumps({
                "email": "invalid-email-format"
            })
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 400)
        self.assertIn("data.email must be email", body['message'])
        self.mock_ses.send_email.assert_not_called()


    def test_database_error(self):
        """
        Test handling of database errors during forgot password request.
        """
        event = {
            "body": json.dumps({
                "email": "test@mail.com"
            })
        }

        with patch('forgotPasswordRequest.app.save_reset_code', side_effect=Exception("Database error")):
            response = lambda_handler(event, {})
            body = json.loads(response['body'])

            self.assertEqual(response['statusCode'], 500)
            self.assertEqual(body['message'], "Error sending email.")
            self.mock_ses.send_email.assert_not_called()

    def test_ses_client_error(self):
        """
        Test handling of SES client errors.
        """
        event = {
            "body": json.dumps({
                "email": "test@mail.com"
            })
        }

        with patch('forgotPasswordRequest.app.save_reset_code', return_value=True):
            response = lambda_handler(event, {})
            body = json.loads(response['body'])

            self.assertEqual(response['statusCode'], 500)
            self.assertEqual(body['message'], "Error sending email.")
            self.mock_ses.send_email.assert_not_called()


    def tearDown(self):
        self.resource_patcher.stop()
        self.ses_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        # Restore original path when done
        sys.path = original_path