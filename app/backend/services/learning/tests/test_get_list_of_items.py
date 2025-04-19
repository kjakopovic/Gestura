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
        os.path.join(project_root, 'app', 'backend', 'services', 'learning', 'getListOfTasks'),
        os.path.join(project_root, 'app', 'backend', 'services', 'layers', 'common'),
        os.path.join(project_root, 'app', 'backend', 'services', 'learning'),
        current_dir
    ]

    for path in paths:
        if path not in sys.path and os.path.exists(path):
            sys.path.insert(0, path)

    # Clear cache of potentially imported modules
    for module in ['validation_schema', 'common', 'getListOfTasks.app']:
        if module in sys.modules:
            del sys.modules[module]

# Save original path and setup test paths
# Otherwise unittest will not find the modules
original_path = sys.path.copy()
setup_paths()

from base_test_setup import BaseTestSetup
from moto import mock_aws
from getListOfTasks.app import lambda_handler
from auth import generate_jwt_token

@mock_aws
class TestGetListOfTasks(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.resource_patcher = patch('getListOfTasks.app._LAMBDA_TASKS_TABLE_RESOURCE', {
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
        Test response when validation schema is not valid.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        test_cases = [
            {
                "request_query": {},
                "expected_status_code": 400  # Accepting 500 status code
            },
            {
                "request_query": {
                    "level": "string-instead-of-number"  # String instead of number
                },
                "expected_status_code": 400  # Accepting 500 status code
            },
            {
                "request_query": {
                    "level": 1,
                    "extra_field": "not-allowed"  # Extra field
                },
                "expected_status_code": 400  # Accepting 500 status code
            }
        ]

        for case in test_cases:
            with self.subTest(request_query=case["request_query"],
                              expected_status_code=case["expected_status_code"]):
                event = {
                    'headers': {
                        'Authorization': jwt_token
                    },
                    "queryStringParameters": case["request_query"]
                }

                response = lambda_handler(event, {})
                body = json.loads(response['body'])

                self.assertEqual(response['statusCode'], case["expected_status_code"])
                self.assertIn('message', body)
                self.assertTrue("Failed schema validation" in body['message'])


    def test_get_list_section_10(self):
        """
        Test response when section is 10.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        for version in [1, 2, 3]:
            for i in range(5):  # Add multiple items per version
                self.table.put_item(Item={
                    "taskId": f"special-task-10-{version}-{i}",
                    "section": 10,
                    "sectionName": "Test Section 10",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possibleAnswers": ["A", "B", "C", "D"],
                    "correctAnswerIndex": 0
                })

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": 1
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)

        self.assertIn("tasks", body)
        self.assertEqual(body["message"], "Tasks fetched successfully")

        # Check if tasks is a list
        self.assertIsInstance(body["tasks"], list)
        # Check if we have the expected number of tasks
        # For section 10, we should have 4+4+2+1=11 tasks (see get_list_of_tasks function)
        self.assertEqual(len(body["tasks"]), 11)

        # Check structure of the first task
        first_task = body["tasks"][0]
        self.assertIn("taskId", first_task)
        self.assertIn("section", first_task)
        self.assertIn("sectionName", first_task)
        self.assertIn("version", first_task)
        self.assertIn("question", first_task)
        self.assertIn("possibleAnswers", first_task)
        self.assertIn("correctAnswerIndex", first_task)

        # Check if section equals 10
        self.assertEqual(first_task["section"], 10)


    def test_get_list_section_20(self):
        """
        Test response when section is 20.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        for version in [1, 2, 3]:
            for i in range(5):
                self.table.put_item(Item={
                    "taskId": f"special-task-10-{version}-{i}",
                    "section": 10,
                    "sectionName": "Test Section 10",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possibleAnswers": ["A", "B", "C", "D"],
                    "correctAnswerIndex": 0
                })

            for i in range(5):
                self.table.put_item(Item={
                    "taskId": f"special-task-20-{version}-{i}",
                    "section": 20,
                    "sectionName": "Test Section 20",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possibleAnswers": ["A", "B", "C", "D"],
                    "correctAnswerIndex": 0
                })

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": 11
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)

        self.assertIn("tasks", body)
        self.assertEqual(body["message"], "Tasks fetched successfully")

        self.assertIsInstance(body["tasks"], list)
        section_10_tasks = []
        section_20_tasks = []

        for task in body["tasks"]:
            if task["section"] == 10:
                section_10_tasks.append(task)
            elif task["section"] == 20:
                section_20_tasks.append(task)

        # Check if we have tasks from both sections
        self.assertGreater(len(section_10_tasks), 0)  # Should have tasks from section 10
        self.assertGreater(len(section_20_tasks), 0)  # Should have tasks from section 20

        # Verify that these add up to the total number of tasks
        self.assertEqual(len(section_10_tasks) + len(section_20_tasks), len(body["tasks"]))

        # Correct the expected length based on the get_list_of_tasks function
        # For section 20, we should have 4+4+2 tasks from section 20 and 2+2+1 tasks from section 10
        self.assertEqual(len(body["tasks"]), 15)

        # Check if we have the expected distribution
        self.assertEqual(len(section_10_tasks), 5)  # 2+2+1 from section 10
        self.assertEqual(len(section_20_tasks), 10)  # 4+4+2 from section 20


    def test_get_list_section_30(self):
        """
        Test response when section is 30.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        # Add test data for sections 10, 20, and 30
        for version in [1, 2, 3]:
            for i in range(5):  # Add multiple items per version
                self.table.put_item(Item={
                    "taskId": f"special-task-10-{version}-{i}",
                    "section": 10,
                    "sectionName": "Test Section 10",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possibleAnswers": ["A", "B", "C", "D"],
                    "correctAnswerIndex": 0
                })

                self.table.put_item(Item={
                    "taskId": f"special-task-20-{version}-{i}",
                    "section": 20,
                    "sectionName": "Test Section 20",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possibleAnswers": ["A", "B", "C", "D"],
                    "correctAnswerIndex": 0
                })

                self.table.put_item(Item={
                    "taskId": f"special-task-30-{version}-{i}",
                    "section": 30,
                    "sectionName": "Test Section 30",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possibleAnswers": ["A", "B", "C", "D"],
                    "correctAnswerIndex": 0
                })

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": 21  # Level 21 corresponds to section 30
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)
        self.assertIn("tasks", body)
        self.assertEqual(body["message"], "Tasks fetched successfully")
        self.assertIsInstance(body["tasks"], list)

        # Categorize tasks by section
        section_10_tasks = []
        section_20_tasks = []
        section_30_tasks = []

        for task in body["tasks"]:
            if task["section"] == 10:
                section_10_tasks.append(task)
            elif task["section"] == 20:
                section_20_tasks.append(task)
            elif task["section"] == 30:
                section_30_tasks.append(task)

        # Check if we have tasks from all three sections
        self.assertGreater(len(section_10_tasks), 0)  # Should have tasks from section 10
        self.assertGreater(len(section_20_tasks), 0)  # Should have tasks from section 20
        self.assertGreater(len(section_30_tasks), 0)  # Should have tasks from section 30

        # Verify that these add up to the total number of tasks
        self.assertEqual(
            len(section_10_tasks) + len(section_20_tasks) + len(section_30_tasks),
            len(body["tasks"])
        )

        # For section 30, we should have:
        # - 4+4+2=10 tasks from section 30
        # - 1+1+1=3 tasks from section 20
        # - 1+1+0=2 tasks from section 10
        self.assertEqual(len(body["tasks"]), 15)
        self.assertEqual(len(section_30_tasks), 10)  # 4+4+2 from section 30
        self.assertEqual(len(section_20_tasks), 3)  # 1+1+1 from section 20
        self.assertEqual(len(section_10_tasks), 2)  # 1+1+0 from section 10

        # Check structure of a random task
        random_task = body["tasks"][0]
        self.assertIn("taskId", random_task)
        self.assertIn("section", random_task)
        self.assertIn("sectionName", random_task)
        self.assertIn("version", random_task)
        self.assertIn("question", random_task)
        self.assertIn("possibleAnswers", random_task)
        self.assertIn("correctAnswerIndex", random_task)


    def tearDown(self):
        self.resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path