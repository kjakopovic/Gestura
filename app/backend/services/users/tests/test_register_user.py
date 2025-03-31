from base_test_setups import BaseTestSetup
from moto import mock_aws

import json
import sys
import os

if 'validation_schema' in sys.modules:
    del sys.modules['validation_schema']

new_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'signUp'))


sys.path.append(new_path)

#from signUp.lambda_handler import lambda_handler
from app import lambda_handler

@mock_aws
class TestRegisterUser(BaseTestSetup):
    def setUp(self):
        super().setUp()

    def test_validation_schema(self):
        """
        Test response when validation schema is not satisfied.
        """

        test_cases = [
            {
                "request_body": {
                    "email": "test1@mail.com",
                    "password": "password123"
                },
                "expected_validation_message": "data must contain ['username'] properties"
            },
            {
                "request_body": {
                    "email": "test1@mail.com",
                    "password": "password123",
                    "username": "UserName",
                    "randomField": "randomValue"
                },
                "expected_validation_message": "data must not contain {'randomField'} properties"
            },
            {
                "request_body": {
                    "email": "test1",
                    "password": "password123",
                    "username": "UserName"
                },
                "expected_validation_message": "data.email must be email"
            },
            {
                "request_body": {
                    "email": "test1",
                    "password": "12",
                    "username": "UserName"
                },
                "expected_validation_message": "data.password must be at least 8 characters"
            },
            {
                "request_body": {
                    "email": "test1@mail.com",
                    "password": "password123",
                    "username": ""
                },
                "expected_validation_message": "data.username must be longer than or equal to 1 characters"
            }
        ]

        for case in test_cases:
            with self.subTest(request_body=case["request_body"],
                              expected_validation_message=case["expected_validation_message"]):
                # Arrange
                event = {
                    "body": json.dumps(case["request_body"])
                }

                # Act
                response = lambda_handler(event, {})
                body = json.loads(response['body'])

                self.assertEqual(response['statusCode'], 400)
                self.assertIn(case["expected_validation_message"], body['message'])

    def test_when_username_already_taken(self):
        """
        Test response when username is already taken.
        """

        # Arrange
        event = {
            "body": json.dumps({
                "email": "test2@mail.com",
                "password": "password123",
                "username": "TestUser"
            })
        }

        # Act
        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        # Assert
        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(body['message'], "Username already in use.")

    def test_email_already_in_use(self):
        """
        Test response when email is already in use.
        """
        # Arrange
        event = {
            "body": json.dumps({
                "email": "test@mail.com",
                "password": "password123",
                "username": "TestUser2"
            })
        }

        # Act
        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        # Assert
        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(body['message'], "Email already in use.")

    def test_success(self):
        """
        Test response when user registers successfully.
        """

        # Arrange
        event = {
            "body": json.dumps({
                "email": "test2@mail.com",
                "password": "password123",
                "username": "TestUser2"
            })
        }

        # Act
        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        # Assert
        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "User created successfully")


sys.path.remove(new_path)