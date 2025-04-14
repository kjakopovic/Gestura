import json
import sys
import os
import unittest

from unittest.mock import patch

# Setup path resolution
def setup_paths():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..', '..', '..'))

    paths = [
        os.path.join(project_root, 'app', 'backend', 'services', 'learning', 'createTask'),
        os.path.join(project_root, 'app', 'backend', 'services', 'layers', 'common'),
        os.path.join(project_root, 'app', 'backend', 'services', 'learning'),
        current_dir
    ]

    for path in paths:
        if path not in sys.path and os.path.exists(path):
            sys.path.insert(0, path)

    # Clear cache of potentially imported modules
    for module in ['validation_schema', 'common', 'createTask.app']:
        if module in sys.modules:
            del sys.modules[module]

# Save original path and setup test paths
# Otherwise unittest will not find the modules
original_path = sys.path.copy()
setup_paths()

from base_test_setup import BaseTestSetup
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
                "expected_validation_message": "data must contain ['correctAnswerIndex', 'possibleAnswers', 'question', 'section', 'sectionName', 'version'] properties"
            },
            {
                "request_body": {
                    "section": 10,
                    "sectionName": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possibleAnswers": ["Sign A", "Sign B", "Sign C", "Sign D"]
                    # Missing correctAnswerIndex
                },
                "expected_validation_message": "data must contain ['correctAnswerIndex'] properties"
            },
            {
                "request_body": {
                    "section": 10,
                    "sectionName": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    # Missing possibleAnswers
                    "correctAnswerIndex": 0
                },
                "expected_validation_message": "data must contain ['possibleAnswers'] properties"
            },
            {
                "request_body": {
                    "section": 10,
                    "sectionName": "Basic Grammar",
                    "version": 1,
                    # Missing question
                    "possibleAnswers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correctAnswerIndex": 0
                },
                "expected_validation_message": "data must contain ['question'] properties"
            },
            {
                "request_body": {
                    "section": 10,
                    # Missing sectionName
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possibleAnswers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correctAnswerIndex": 0
                },
                "expected_validation_message": "data must contain ['sectionName'] properties"
            },
            {
                "request_body": {
                    # Missing section
                    "sectionName": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possibleAnswers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correctAnswerIndex": 0
                },
                "expected_validation_message": "data must contain ['section'] properties"
            },
            {
                "request_body": {
                    "section": 10,
                    "sectionName": "Basic Grammar",
                    # Missing version
                    "question": "What is the correct sign for 'hello'?",
                    "possibleAnswers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correctAnswerIndex": 0
                },
                "expected_validation_message": "data must contain ['version'] properties"
            },
            {
                "request_body": {
                    "section": "grammar",  # String instead of number
                    "sectionName": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possibleAnswers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correctAnswerIndex": 0
                },
                "expected_validation_message": "data.section must be number"
            },
            {
                "request_body": {
                    "section": 1,  # Not a multiple of 10
                    "sectionName": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possibleAnswers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correctAnswerIndex": 0
                },
                "expected_validation_message": "data.section must be multiple of 10"
            },
            {
                "request_body": {
                    "section": 10,
                    "sectionName": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possibleAnswers": "not an array",  # Invalid type
                    "correctAnswerIndex": 0
                },
                "expected_validation_message": "data.possibleAnswers must be array"
            },
            {
                "request_body": {
                    "section": 10,
                    "sectionName": "Basic Grammar",
                    "version": "1",  # String instead of number
                    "question": "What is the correct sign for 'hello'?",
                    "possibleAnswers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correctAnswerIndex": 0
                },
                "expected_validation_message": "data.version must be number"
            },
            {
                "request_body": {
                    "section": 10,
                    "sectionName": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possibleAnswers": ["Sign A", "Sign B", "Sign C"],  # Only 3 items
                    "correctAnswerIndex": 0
                },
                "expected_validation_message": "data.possibleAnswers must contain at least 4 items"
            },
            {
                "request_body": {
                    "section": 10,
                    "sectionName": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possibleAnswers": ["Sign A", "Sign B", "Sign C", "Sign D", "Sign E"],  # 5 items
                    "correctAnswerIndex": 0
                },
                "expected_validation_message": "data.possibleAnswers must contain less than or equal to 4 items"
            },
            {
                "request_body": {
                    "section": 10,
                    "sectionName": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possibleAnswers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correctAnswerIndex": 4  # Out of range index
                },
                "expected_validation_message": "data.correctAnswerIndex must be one of [0, 1, 2, 3]"
            },
            {
                "request_body": {
                    "section": 10,
                    "sectionName": "Basic Grammar",
                    "version": 1,
                    "question": "What is the correct sign for 'hello'?",
                    "possibleAnswers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                    "correctAnswerIndex": 0,
                    "extraField": "value"  # Extra field
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
                "sectionName": "Basic Grammar",
                "version": 1,
                "question": "What is the correct sign for 'hello'?",
                "possibleAnswers": ["Sign A", "Sign B", "Sign C", "Sign D"],
                "correctAnswerIndex": 0
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