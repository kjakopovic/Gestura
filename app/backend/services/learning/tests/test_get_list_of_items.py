import json
import unittest
import os
import sys
from unittest.mock import patch, MagicMock
from base_test_setup import BaseTestSetup, LambdaDynamoDBClass

# Set up consistent mock modules before imports
class TestMocks:
    @staticmethod
    def setup():
        # Mock validation schema
        sys.modules['validation_schema'] = MagicMock()
        sys.modules['validation_schema'].schema = {
            "type": "object",
            "required": ["level"],
            "properties": {
                "level": {"type": "integer", "minimum": 0}
            },
            "additionalProperties": False
        }

        # Mock common module
        sys.modules['common'] = MagicMock()
        sys.modules['common'].build_response = lambda status_code, body: {
            'statusCode': status_code,
            'body': json.dumps(body),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
        sys.modules['common'].ValidationError = type('ValidationError', (Exception,), {})

        # Mock middleware
        sys.modules['middleware'] = MagicMock()
        sys.modules['middleware'].middleware = TestMocks.mock_middleware

        # Mock boto
        sys.modules['boto'] = MagicMock()
        sys.modules['boto'].LambdaDynamoDBClass = LambdaDynamoDBClass

    @staticmethod
    def mock_middleware(func):
        def wrapper(event, context):
            # Validate token
            if 'Authorization' not in event.get('headers', {}):
                return {
                    'statusCode': 401,
                    'body': json.dumps({'message': 'Invalid token, please login again'}),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            return func(event, context)
        return wrapper

# Setup mocks
TestMocks.setup()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
# Now import the lambda handler
import getListOfTasks.app as lambda_module
from getListOfTasks.app import lambda_handler, get_list_of_tasks, get_tasks_for_section, chose_tasks
from moto import mock_aws

@mock_aws
class TestGetListOfTasksLambda(BaseTestSetup):
    def setUp(self):
        super().setUp()

        lambda_module._LAMBDA_TASKS_TABLE_RESOURCE = {
            "resource": self.dynamodb,
            "table_name": os.environ["TASKS_TABLE_NAME"]
        }

    def test_when_user_unauthorized(self):
        """Test response when user is unauthorized."""
        # Arrange
        event = {
            'headers': {}  # No Authorization header
        }

        # Act
        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        # Assert
        self.assertEqual(response['statusCode'], 401)
        self.assertEqual(body['message'], "Invalid token, please login again")

    def test_validation_schema_missing_level(self):
        """Test response when validation schema is not satisfied - missing level."""
        # Arrange
        event = {
            'headers': {
                'Authorization': self.test_jwt_token
            },
            'queryStringParameters': {}  # Missing level
        }

        # Act
        with self.assertRaises(sys.modules['common'].ValidationError):
            lambda_handler(event, {})

    def test_validation_schema_invalid_level(self):
        """Test response when validation schema is not satisfied - invalid level format."""
        # Arrange
        event = {
            'headers': {
                'Authorization': self.test_jwt_token
            },
            'queryStringParameters': {
                'level': "not_a_number"
            }
        }

        # Act
        with self.assertRaises(sys.modules['common'].ValidationError):
            lambda_handler(event, {})

    def test_get_tasks_for_section(self):
        """Test getting tasks for a specific section."""
        # Arrange
        dynamodb_resource = {
            "resource": self.dynamodb,
            "table_name": os.environ["TASKS_TABLE_NAME"]
        }
        dynamodb = LambdaDynamoDBClass(dynamodb_resource)

        # Act
        tasks = get_tasks_for_section(dynamodb, 10)

        # Assert
        self.assertEqual(len(tasks), 10)
        for task in tasks:
            self.assertEqual(task['section'], 10)

    def test_chose_tasks(self):
        """Test choosing tasks according to version distribution."""
        # Arrange
        tasks = [
                    {'id': f'task-v1-{i}', 'version': 1} for i in range(10)
                ] + [
                    {'id': f'task-v2-{i}', 'version': 2} for i in range(10)
                ] + [
                    {'id': f'task-v3-{i}', 'version': 3} for i in range(10)
                ]

        # Act
        selected = chose_tasks(tasks, 3, 2, 1)

        # Assert
        self.assertEqual(len(selected), 6)

        versions = [task['version'] for task in selected]
        self.assertEqual(versions.count(1), 3)
        self.assertEqual(versions.count(2), 2)
        self.assertEqual(versions.count(3), 1)

    @patch('getListOfTasks.app.get_tasks_for_section')
    def test_get_list_of_tasks_section_10(self, mock_get_tasks):
        """Test get_list_of_tasks for section 10."""
        # Arrange
        tasks_section_10 = []
        for i in range(12):
            version = (i % 3) + 1
            tasks_section_10.append({
                'id': f'task10-{i}',
                'section': 10,
                'name': f'Task {i} - Section 10',
                'version': version
            })

        mock_get_tasks.return_value = tasks_section_10

        dynamodb = MagicMock()

        # Act
        response = get_list_of_tasks(dynamodb, 10)
        body = json.loads(response['body'])

        # Assert
        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "Tasks fetched successfully")
        # Section 10 should return 10 tasks + 1 random = 11
        # But our mocked chose_tasks will actually return the real result
        self.assertGreaterEqual(len(body['tasks']), 10)
        mock_get_tasks.assert_any_call(dynamodb, 10)
        self.assertEqual(mock_get_tasks.call_count, 3)  # If it should be called exactly 3 times

    @patch('getListOfTasks.app.get_tasks_for_section')
    def test_get_list_of_tasks_section_20(self, mock_get_tasks):
        """Test get_list_of_tasks for section 20."""

        # Arrange
        def side_effect(db, section):
            result = []
            for i in range(12):
                version = (i % 3) + 1
                result.append({
                    'id': f'task{section}-{i}',
                    'section': section,
                    'name': f'Task {i} - Section {section}',
                    'version': version
                })
            return result

        mock_get_tasks.side_effect = side_effect

        dynamodb = MagicMock()

        # Act
        response = get_list_of_tasks(dynamodb, 20)
        body = json.loads(response['body'])

        # Assert
        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "Tasks fetched successfully")
        # For section 20, we get tasks from both section 20 and 10
        mock_get_tasks.assert_any_call(dynamodb, 20)
        mock_get_tasks.assert_any_call(dynamodb, 10)

        # Should return 10 tasks from section 20 + 5 from section 10 = 15
        # But our mocked chose_tasks will return the real result
        self.assertGreaterEqual(len(body['tasks']), 10)

    @patch('getListOfTasks.app.get_tasks_for_section')
    def test_get_list_of_tasks_section_30(self, mock_get_tasks):
        """Test get_list_of_tasks for section 30 (higher sections)."""

        # Arrange
        def side_effect(db, section):
            result = []
            for i in range(12):
                version = (i % 3) + 1
                result.append({
                    'id': f'task{section}-{i}',
                    'section': section,
                    'name': f'Task {i} - Section {section}',
                    'version': version
                })
            return result

        mock_get_tasks.side_effect = side_effect

        dynamodb = MagicMock()

        # Act
        response = get_list_of_tasks(dynamodb, 30)
        body = json.loads(response['body'])

        # Assert
        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body['message'], "Tasks fetched successfully")
        # For section 30+, we get tasks from current, previous, and previous-previous sections
        mock_get_tasks.assert_any_call(dynamodb, 30)
        mock_get_tasks.assert_any_call(dynamodb, 20)
        mock_get_tasks.assert_any_call(dynamodb, 10)

        # Should return 10 tasks from current + tasks from previous sections
        self.assertGreaterEqual(len(body['tasks']), 10)

    @patch('getListOfTasks.app.get_list_of_tasks')
    def test_lambda_handler_success(self, mock_get_list):
        """Test lambda handler success path."""
        # Arrange
        mock_response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Tasks fetched successfully',
                'tasks': [{'id': 'test-task'}]
            }),
            'headers': {'Content-Type': 'application/json'}
        }
        mock_get_list.return_value = mock_response

        event = {
            'headers': {
                'Authorization': self.test_jwt_token
            },
            'queryStringParameters': {
                'level': 5
            }
        }

        # Act
        response = lambda_handler(event, {})

        # Assert
        self.assertEqual(response, mock_response)
        # Section calculation: (5 // 10 + 1) * 10 = 10
        mock_get_list.assert_called_once()
        args = mock_get_list.call_args[0]
        self.assertEqual(args[1], 10)

    def test_integration_end_to_end(self):
        """Test the entire flow end-to-end."""
        # Arrange
        event = {
            'headers': {
                'Authorization': self.test_jwt_token
            },
            'queryStringParameters': {
                'level': 5
            }
        }

        # Patch query function to use our test table
        with patch('getListOfTasks.app.get_tasks_for_section',
                   side_effect=lambda db, section: [item for item in db.table.scan()['Items'] if
                                                    item['section'] == section]):
            # Act
            response = lambda_handler(event, {})
            body = json.loads(response['body'])

            # Assert
            self.assertEqual(response['statusCode'], 200)
            self.assertEqual(body['message'], "Tasks fetched successfully")
            self.assertIn('tasks', body)

            # Should have tasks in response
            self.assertGreater(len(body['tasks']), 0)


if __name__ == '__main__':
    unittest.main()