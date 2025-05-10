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
        self.languages_resource_patcher = patch('getListOfTasks.app._LAMBDA_LANGUAGES_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["LANGUAGES_TABLE_NAME"]
        })

        self.users_resource_patcher.start()
        self.tasks_resource_patcher.start()
        self.languages_resource_patcher.start()


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
                "expected_status_code": 400
            },
            {
                "request_query": {
                    "level": "1"  # Missing language
                },
                "expected_status_code": 400
            },
            {
                "request_query": {
                    "language": "en"  # Missing level
                },
                "expected_status_code": 400
            },
            {
                "request_query": {
                    "level": "string-instead-of-number",
                    "language": "en"
                },
                "expected_status_code": 400
            },
            {
                "request_query": {
                    "level": 1,
                    "language": "en",
                    "extra_field": "not-allowed"
                },
                "expected_status_code": 400
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
                "level": "41",
                "language": "en"
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 403)
        self.assertIn("message", body)

        self.assertEqual(body["message"], "User test@mail.com is not allowed to access level 41.")
        self.assertEqual(body["current_level"], 1)


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
                    "correct_answer_index": 0,
                    "language_id": "es"
                })
                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-20-{version}-{i}",
                    "section": 20,
                    "section_name": "Test Section 20",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "es"
                })

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": "1",
                "language": "es"
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


    def test_when_no_current_level_for_language(self):
        """
        Test response when the user has no current level for the specified language.
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
                    "correct_answer_index": 0,
                    "language_id": "de"
                })
                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-20-{version}-{i}",
                    "section": 20,
                    "section_name": "Test Section 20",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "de"
                })

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": "1",
                "language": "de"
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

        updated_user = self.users_table.get_item(Key={'email': 'test@mail.com'})
        # print(f"Updated user: {updated_user}")


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
                    "correct_answer_index": 0,
                    "language_id": "hr"
                })

            for i in range(5):
                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-20-{version}-{i}",
                    "section": 20,
                    "section_name": "Test Section 20",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "hr"
                })

        # self.users_table.update_item(
        #     Key={"email": "test@mail.com"},
        #     UpdateExpression="SET current_level = :level",
        #     ExpressionAttributeValues={":level": 10}
        # )

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": "11",
                "language": "hr"
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
                    "correct_answer_index": 0,
                    "language_id": "fr"
                })

                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-20-{version}-{i}",
                    "section": 20,
                    "section_name": "Test Section 20",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "fr"
                })

                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-30-{version}-{i}",
                    "section": 30,
                    "section_name": "Test Section 30",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "fr"
                })

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": "21",  # Level 21 corresponds to section 30
                "language": "fr"
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


    def test_user_subscription_is_0(self):
        """
        Test response when the user has a subscription level of 0.
        """
        self.no_sub_user = {
            "email": "nosub@mail.com",
            "current_level": {
                "es": 1,
                "hr": 11,
                "fr": 21,
                "en": 11
            },
            "subscription": 0
        }
        self.users_table.put_item(Item=self.no_sub_user)

        jwt_token = generate_jwt_token("nosub@mail.com")

        for version in [1, 2, 3]:
            for i in range(5):
                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-10-{version}-{i}",
                    "section": 10,
                    "section_name": "Test Section 10",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "en"
                })

                self.tasks_table.put_item(Item={
                    "task_id": f"special-task-20-{version}-{i}",
                    "section": 20,
                    "section_name": "Test Section 20",
                    "version": version,
                    "question": f"Test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "en"
                })

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "level": "11",
                "language": "en"
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)
        self.assertIn("tasks", body)
        self.assertEqual(body["message"], "Tasks fetched successfully")
        self.assertIsInstance(body["tasks"], list)
        self.assertEqual(len(body["tasks"]), 15)
        # print(f"Tasks: {body['tasks']}")

        # Count tasks by section and version
        section_10_tasks = []
        section_20_tasks = []
        version_1_tasks = []
        version_2_tasks = []
        version_3_tasks = []

        for task in body["tasks"]:
            # Count by section
            if task["section"] == 10:
                section_10_tasks.append(task)
            elif task["section"] == 20:
                section_20_tasks.append(task)

            # Count by version
            if task["version"] == 1:
                version_1_tasks.append(task)
            elif task["version"] == 2:
                version_2_tasks.append(task)
            elif task["version"] == 3:
                version_3_tasks.append(task)

        # Check section distribution (for level 11 it should be 5 from section 10 and 10 from section 20)
        self.assertEqual(len(section_10_tasks), 5, "Should have 5 tasks from section 10")
        self.assertEqual(len(section_20_tasks), 10, "Should have 10 tasks from section 20")

        # Check version distribution (expecting 4+2=6 for version 1, 4+2=6 for version 2, and 2+1=3 for version 3)
        self.assertEqual(len(version_1_tasks), 8, "Should have 8 tasks of version 1")
        self.assertEqual(len(version_2_tasks), 7, "Should have 7 tasks of version 2")
        self.assertEqual(len(version_3_tasks), 0, "Should have 0 tasks of version 3")


    def test_get_sections_when_max_section_is_10(self):
        """
        Test that when max_section is 10, the function returns (10, 10).
        """
        # Create tasks for section 10
        for version in [1, 2, 3]:
            for i in range(10):
                self.tasks_table.put_item(Item={
                    "task_id": f"edge-task-10-{version}-{i}",
                    "section": 10,
                    "section_name": "Test Section 10",
                    "version": version,
                    "question": f"Edge case test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "it"
                })

        jwt_token = generate_jwt_token("test@mail.com")

        # Patch the get_two_random_sections function to always return (10, 10)
        with patch('getListOfTasks.app.get_two_random_sections') as mock_get_sections:
            mock_get_sections.return_value = (10, 10)

            event = {
                'headers': {
                    'Authorization': jwt_token
                },
                "queryStringParameters": {
                    "level": "11",
                    "language": "it"
                }
            }

            response = lambda_handler(event, {})
            body = json.loads(response['body'])

            self.assertEqual(response['statusCode'], 200)
            self.assertIn("tasks", body)

            section_10_tasks = [task for task in body["tasks"] if task["section"] == 10]
            print(f"\n\nSection 10 tasks: {len(section_10_tasks)}")


            # All tasks should be from section 10
            for task in body["tasks"]:
                self.assertEqual(task["section"], 10)


    def test_get_sections_when_max_section_is_20(self):
        """
        Test that when max_section is 20, the function returns (10, 20).
        """
        # Create tasks for sections 10 and 20
        for version in [1, 2, 3]:
            for i in range(10):
                self.tasks_table.put_item(Item={
                    "task_id": f"edge-task-10-{version}-{i}",
                    "section": 10,
                    "section_name": "Test Section 10",
                    "version": version,
                    "question": f"Edge case test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "ru"
                })

                self.tasks_table.put_item(Item={
                    "task_id": f"edge-task-20-{version}-{i}",
                    "section": 20,
                    "section_name": "Test Section 20",
                    "version": version,
                    "question": f"Edge case test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "ru"
                })

        jwt_token = generate_jwt_token("test@mail.com")

        # Patch the get_two_random_sections function to return (10, 20)
        with patch('getListOfTasks.app.get_two_random_sections') as mock_get_sections:
            mock_get_sections.return_value = (10, 20)

            event = {
                'headers': {
                    'Authorization': jwt_token
                },
                "queryStringParameters": {
                    "level": "21",
                    "language": "ru"
                }
            }

            response = lambda_handler(event, {})
            body = json.loads(response['body'])

            print(f"Response body: {body}")

            self.assertEqual(response['statusCode'], 200)
            self.assertIn("tasks", body)

            # There should be tasks from both section 10 and 20
            section_10_tasks = [task for task in body["tasks"] if task["section"] == 10]
            section_20_tasks = [task for task in body["tasks"] if task["section"] == 20]

            print(f"Total tasks: {len(body['tasks'])}")
            print(f"Section 10 tasks: {len(section_10_tasks)}")
            print(f"Section 20 tasks: {len(section_20_tasks)}")

            self.assertEqual(len(body["tasks"]), 15, "Should have 15 tasks in total")

            self.assertGreater(len(section_10_tasks), 0, "Should have tasks from section 10")
            self.assertGreater(len(section_20_tasks), 0, "Should have tasks from section 20")

            # Verify the total count of tasks
            self.assertEqual(len(section_10_tasks) + len(section_20_tasks), len(body["tasks"]))


    def test_get_sections_when_max_section_is_10_subscription_is_0(self):
        """
        Test that when max_section is 10, the function returns (10, 10).
        """
        # Create tasks for section 10
        self.no_sub_user = {
            "email": "nosub@mail.com",
            "current_level": {
                "es": 1,
                "hr": 11,
                "fr": 21,
                "en": 11
            },
            "subscription": 0
        }
        self.users_table.put_item(Item=self.no_sub_user)

        for version in [1, 2, 3]:
            for i in range(10):
                self.tasks_table.put_item(Item={
                    "task_id": f"edge-task-10-{version}-{i}",
                    "section": 10,
                    "section_name": "Test Section 10",
                    "version": version,
                    "question": f"Edge case test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "it"
                })

        jwt_token = generate_jwt_token("test@mail.com")

        # Patch the get_two_random_sections function to always return (10, 10)
        with patch('getListOfTasks.app.get_two_random_sections') as mock_get_sections:
            mock_get_sections.return_value = (10, 10)

            event = {
                'headers': {
                    'Authorization': jwt_token
                },
                "queryStringParameters": {
                    "level": "11",
                    "language": "it"
                }
            }

            response = lambda_handler(event, {})
            body = json.loads(response['body'])

            self.assertEqual(response['statusCode'], 200)
            self.assertIn("tasks", body)

            section_10_tasks = [task for task in body["tasks"] if task["section"] == 10]
            print(f"\n\nSection 10 tasks: {len(section_10_tasks)}")


            # All tasks should be from section 10
            for task in body["tasks"]:
                self.assertEqual(task["section"], 10)


    def test_get_sections_when_max_section_is_20_subscription_is_0(self):
        """
        Test that when max_section is 20, the function returns (10, 20).
        """
        self.no_sub_user = {
            "email": "nosub@mail.com",
            "current_level": {
                "es": 1,
                "hr": 11,
                "fr": 21,
                "en": 11
            },
            "subscription": 0
        }
        self.users_table.put_item(Item=self.no_sub_user)

        # Create tasks for sections 10 and 20
        for version in [1, 2, 3]:
            for i in range(10):
                self.tasks_table.put_item(Item={
                    "task_id": f"edge-task-10-{version}-{i}",
                    "section": 10,
                    "section_name": "Test Section 10",
                    "version": version,
                    "question": f"Edge case test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "ru"
                })

                self.tasks_table.put_item(Item={
                    "task_id": f"edge-task-20-{version}-{i}",
                    "section": 20,
                    "section_name": "Test Section 20",
                    "version": version,
                    "question": f"Edge case test question version {version}",
                    "possible_answers": ["A", "B", "C", "D"],
                    "correct_answer_index": 0,
                    "language_id": "ru"
                })

        jwt_token = generate_jwt_token("test@mail.com")

        # Patch the get_two_random_sections function to return (10, 20)
        with patch('getListOfTasks.app.get_two_random_sections') as mock_get_sections:
            mock_get_sections.return_value = (10, 20)

            event = {
                'headers': {
                    'Authorization': jwt_token
                },
                "queryStringParameters": {
                    "level": "21",
                    "language": "ru"
                }
            }

            response = lambda_handler(event, {})
            body = json.loads(response['body'])

            print(f"Response body: {body}")

            self.assertEqual(response['statusCode'], 200)
            self.assertIn("tasks", body)

            # There should be tasks from both section 10 and 20
            section_10_tasks = [task for task in body["tasks"] if task["section"] == 10]
            section_20_tasks = [task for task in body["tasks"] if task["section"] == 20]

            print(f"Total tasks: {len(body['tasks'])}")
            print(f"Section 10 tasks: {len(section_10_tasks)}")
            print(f"Section 20 tasks: {len(section_20_tasks)}")

            self.assertEqual(len(body["tasks"]), 15, "Should have 15 tasks in total")

            self.assertGreater(len(section_10_tasks), 0, "Should have tasks from section 10")
            self.assertGreater(len(section_20_tasks), 0, "Should have tasks from section 20")

            # Verify the total count of tasks
            self.assertEqual(len(section_10_tasks) + len(section_20_tasks), len(body["tasks"]))



    def tearDown(self):
        self.tasks_resource_patcher.stop()
        self.users_resource_patcher.stop()
        self.languages_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path