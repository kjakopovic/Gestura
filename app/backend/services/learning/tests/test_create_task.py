import json
import sys
import os
import unittest
from unittest.mock import patch
from base_test_setup import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('createTask')
BaseTestSetup.clear_module_cache(['validation_schema', 'common', 'createTask.app'])

from moto import mock_aws
from createTask.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestCreateTask(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.resource_patcher = patch('createTask.app._LAMBDA_TASKS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["TASKS_TABLE_NAME"]
        })
        self.resource_patcher.start()


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
        Test response when validation schema is not satisfied.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        test_cases = [
            {
                "request_body": {},
                "expected_validation_message": "data must contain ['correct_answer_index', 'possible_answers', 'question', 'section', 'section_name', 'version'] properties"
            },
            {
                "request_body": {
                    "section": 10,
                    "section_name": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possible_answers": ["Sign A", "Sign B", "Sign C", "Sign D"]
                    # Missing correct_answer_index
                },
                "expected_validation_message": "data must contain ['correct_answer_index'] properties"
            },
            {
                "request_body": {
                    "section": 10,
                    "section_name": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    # Missing possible_answers
                    "correct_answer_index": 0
                },
                "expected_validation_message": "data must contain ['possible_answers'] properties"
            },
            {
                "request_body": {
                    "section": 10,
                    "section_name": "Basic Grammar",
                    "version": 1,
                    # Missing question
                    "possible_answers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correct_answer_index": 0
                },
                "expected_validation_message": "data must contain ['question'] properties"
            },
            {
                "request_body": {
                    "section": 10,
                    # Missing section_name
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possible_answers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correct_answer_index": 0
                },
                "expected_validation_message": "data must contain ['section_name'] properties"
            },
            {
                "request_body": {
                    # Missing section
                    "section_name": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possible_answers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correct_answer_index": 0
                },
                "expected_validation_message": "data must contain ['section'] properties"
            },
            {
                "request_body": {
                    "section": 10,
                    "section_name": "Basic Grammar",
                    # Missing version
                    "question": "What is the correct sign for 'hello'?",
                    "possible_answers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correct_answer_index": 0
                },
                "expected_validation_message": "data must contain ['version'] properties"
            },
            {
                "request_body": {
                    "section": "grammar",  # String instead of number
                    "section_name": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possible_answers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correct_answer_index": 0
                },
                "expected_validation_message": "data.section must be number"
            },
            {
                "request_body": {
                    "section": 1,  # Not a multiple of 10
                    "section_name": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possible_answers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correct_answer_index": 0
                },
                "expected_validation_message": "data.section must be multiple of 10"
            },
            {
                "request_body": {
                    "section": 10,
                    "section_name": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possible_answers": "not an array",  # Invalid type
                    "correct_answer_index": 0
                },
                "expected_validation_message": "data.possible_answers must be array"
            },
            {
                "request_body": {
                    "section": 10,
                    "section_name": "Basic Grammar",
                    "version": "1",  # String instead of number
                    "question": "What is the correct sign for 'hello'?",
                    "possible_answers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correct_answer_index": 0
                },
                "expected_validation_message": "data.version must be number"
            },
            {
                "request_body": {
                    "section": 10,
                    "section_name": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possible_answers": ["Sign A", "Sign B", "Sign C"],  # Only 3 items
                    "correct_answer_index": 0
                },
                "expected_validation_message": "data.possible_answers must contain at least 4 items"
            },
            {
                "request_body": {
                    "section": 10,
                    "section_name": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possible_answers": ["Sign A", "Sign B", "Sign C", "Sign D", "Sign E"],  # 5 items
                    "correct_answer_index": 0
                },
                "expected_validation_message": "data.possible_answers must contain less than or equal to 4 items"
            },
            {
                "request_body": {
                    "section": 10,
                    "section_name": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possible_answers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correct_answer_index": 4  # Out of range index
                },
                "expected_validation_message": "data.correct_answer_index must be one of [0, 1, 2, 3]"
            },
            {
                "request_body": {
                    "section": 10,
                    "section_name": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possible_answers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correct_answer_index": 0,
                    "extra_field": "value"  # Extra field
                },
                "expected_validation_message": "data must not contain {'extra_field'} properties"
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


    def test_successful_request(self):
        """
        Test successful request.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "body": json.dumps({
                "section": 10,
                "section_name": "Basic Grammar",
                "version": 1,
                "question": "What is the correct sign for 'hello'?",
                "possible_answers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                "correct_answer_index": 0
            })
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)


    def tearDown(self):
        self.resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path