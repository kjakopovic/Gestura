import json
import sys
import os
import unittest
from unittest.mock import patch
from base_test_setup import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('getListOfTasks')
BaseTestSetup.clear_module_cache(['validation_schema', 'common', 'getListOfTasks.app'])

from moto import mock_aws
from getListOfTasks.app import lambda_handler
from auth import generate_jwt_token

@mock_aws
class TestGetListOfTasks(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create a patcher for the DynamoDB resource in the lambda handler
        self.tasks_resource_patcher = patch('getListOfTasks.app._LAMBDA_TASKS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["TASKS_TABLE_NAME"]
        })
        self.users_resource_patcher = patch('getListOfTasks.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.users_resource_patcher.start()
        self.tasks_resource_patcher.start()


    def test_when_user_not_authorized(self):
        """
        Test response when a user is unauthorized.
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
        Test response when the validation schema is not valid.
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


    def test_user_not_allowed(self):
        """
        Test response when the user is not allowed to access the level.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": "41"
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 403)
        self.assertIn("message", body)

        self.assertEqual(body["message"], "User test@mail.com is not allowed to access level 41.")
        self.assertEqual(body["current_level"], 0)


    def test_get_list_section_10(self):
        """
        Test response when the section is 10.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        for version in [1, 2, 3]:
            for i in range(10):  # Add multiple items per version
                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-10-{version}-{i}",
                    "section": 10,
                    "section_name": "Test Section 10",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0
                })
                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-20-{version}-{i}",
                    "section": 20,
                    "section_name": "Test Section 20",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0
                })

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": "1"
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
        self.assertEqual(len(body["tasks"]), 15)

        # Check the structure of the first task
        first_task = body["tasks"][0]
        self.assertIn("task_id", first_task)
        self.assertIn("section", first_task)
        self.assertIn("section_name", first_task)
        self.assertIn("version", first_task)
        self.assertIn("question", first_task)
        self.assertIn("possible_answers", first_task)
        self.assertIn("correct_answer_index", first_task)

        # Check if the section equals 10
        self.assertEqual(first_task["section"], 10)


    def test_get_list_section_20(self):
        """
        Test response when the section is 20.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        for version in [1, 2, 3]:
            for i in range(5):
                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-10-{version}-{i}",
                    "section": 10,
                    "section_name": "Test Section 10",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0
                })

            for i in range(5):
                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-20-{version}-{i}",
                    "section": 20,
                    "section_name": "Test Section 20",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0
                })

        self.users_table.update_item(
            Key={"email": "test@mail.com"},
            UpdateExpression="SET current_level = :level",
            ExpressionAttributeValues={":level": 10}
        )

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": "11"
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
        Test response when the section is 30.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        # Add test data for sections 10, 20, and 30
        for version in [1, 2, 3]:
            for i in range(5):  # Add multiple items per version
                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-10-{version}-{i}",
                    "section": 10,
                    "section_name": "Test Section 10",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0
                })

                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-20-{version}-{i}",
                    "section": 20,
                    "section_name": "Test Section 20",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0
                })

                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-30-{version}-{i}",
                    "section": 30,
                    "section_name": "Test Section 30",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0
                })

        self.users_table.update_item(
            Key={"email": "test@mail.com"},
            UpdateExpression="SET current_level = :level",
            ExpressionAttributeValues={":level": 20}
        )

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": "21"  # Level 21 corresponds to section 30
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

        # Check the structure of a random task
        random_task = body["tasks"][0]
        self.assertIn("task_id", random_task)
        self.assertIn("section", random_task)
        self.assertIn("section_name", random_task)
        self.assertIn("version", random_task)
        self.assertIn("question", random_task)
        self.assertIn("possible_answers", random_task)
        self.assertIn("correct_answer_index", random_task)


    def test_get_list_section_40(self):
        """
        Test response when the section is 40, but there are no tasks for it.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        # Add test data for sections 10, 20, and 30
        for version in [1, 2, 3]:
            for i in range(5):  # Add multiple items per version
                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-10-{version}-{i}",
                    "section": 10,
                    "section_name": "Test Section 10",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0
                })

                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-20-{version}-{i}",
                    "section": 20,
                    "section_name": "Test Section 20",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0
                })

                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-30-{version}-{i}",
                    "section": 30,
                    "section_name": "Test Section 30",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0
                })

        self.users_table.update_item(
            Key={"email": "test@mail.com"},
            UpdateExpression="SET current_level = :level",
            ExpressionAttributeValues={":level": 30}
        )

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": "31"  # Level 31 corresponds to section 40
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
        self.assertEqual(len(section_30_tasks), 8)
        self.assertEqual(len(section_20_tasks), 4)
        self.assertEqual(len(section_10_tasks), 3)

        # Check the structure of a random task
        random_task = body["tasks"][0]
        self.assertIn("task_id", random_task)
        self.assertIn("section", random_task)
        self.assertIn("section_name", random_task)
        self.assertIn("version", random_task)
        self.assertIn("question", random_task)
        self.assertIn("possible_answers", random_task)
        self.assertIn("correct_answer_index", random_task)


    def tearDown(self):
        self.tasks_resource_patcher.stop()
        self.users_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path