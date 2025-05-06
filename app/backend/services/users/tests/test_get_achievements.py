import json
import sys
import os
import unittest
from unittest.mock import patch
from base_test_setup import BaseTestSetup

original_path = sys.path.copy()
BaseTestSetup.setup_paths('getAchievements')
BaseTestSetup.clear_module_cache(['validation_schema', 'common', 'getAchievements.app'])

from moto import mock_aws
from getAchievements.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestGetAchievements(BaseTestSetup):
    def setUp(self):
        super().setUp()

        self.achievements_resource_patcher = patch('getAchievements.app._LAMBDA_ACHIEVEMENTS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["ACHIEVEMENTS_TABLE_NAME"]
        })
        self.achievements_resource_patcher.start()

    #
    # def test_when_user_not_authorized(self):
    #     """
    #     Test response when a user is unauthorized.
    #     """
    #     event = {
    #         'headers': {'Authorization': 'invalid-token'}
    #     }
    #
    #     response = lambda_handler(event, {})
    #     body = json.loads(response['body'])
    #
    #     self.assertEqual(response['statusCode'], 401)
    #     self.assertEqual(body['message'], "Invalid token, please login again")
    #
    #
    # def test_validation_schema(self):
    #     """
    #     Test the validation schema for query parameters.
    #     """
    #     jwt_token = generate_jwt_token("test@mail.com")
    #
    #     test_cases = [
    #         {
    #             "request_query": {},
    #             "expected_validation_message": "data must contain ['query_page_size'] properties"
    #         },
    #         {
    #             "request_query": {
    #                 "query_page_size": "invalid"
    #             },
    #             "expected_validation_message": "data.query_page_size must match pattern"
    #         },
    #         {
    #             "request_query": {
    #                 "query_page_size": "0"
    #             },
    #             "expected_validation_message": "data.query_page_size must match pattern"
    #         },
    #         {
    #             "request_query": {
    #                 "query_page_size": "-5"
    #             },
    #             "expected_validation_message": "data.query_page_size must match pattern"
    #         },
    #         {
    #             "request_query": {
    #                 "query_page_size": 10
    #             },
    #             "expected_validation_message": "data.query_page_size must be string"
    #         },
    #         {
    #             "request_query": {
    #                 "query_page_size": "10",
    #                 "extraField": "value"
    #             },
    #             "expected_validation_message": "data must not contain {'extraField'} properties"
    #         }
    #     ]
    #
    #     for case in test_cases:
    #         with self.subTest(request_query=case["request_query"],
    #                           expected_validation_message=case["expected_validation_message"]):
    #             event = {
    #                 'headers': {
    #                     'Authorization': jwt_token
    #                 },
    #                 "queryStringParameters": case["request_query"]
    #             }
    #
    #             response = lambda_handler(event, {})
    #             body = json.loads(response['body'])
    #
    #             self.assertEqual(response['statusCode'], 400)
    #             self.assertIn(case["expected_validation_message"], body['message'])


    def test_get_achievements(self):
        """
        Test the get_achievements function with valid parameters.
        """
        self.sample_achievements = [
            {
                "id": "aaaaaaaaa",
                "name": "Achievement 1",
                "description": "Description 1"
            },
            {
                "id": "bbbbbbbbbb",
                "name": "Achievement 2",
                "description": "Description 2"
            },
            {
                "id": "ccccccccc",
                "name": "Achievement 3",
                "description": "Description 3"
            },
            {
                "id": "ddddddddd",
                "name": "Achievement 4",
                "description": "Description 4"
            },
            {
                "id": "eeeeeeeee",
                "name": "Achievement 5",
                "description": "Description 5"
            },
            {
                "id": "fffffffff",
                "name": "Achievement 6",
                "description": "Description 6"
            },
            {
                "id": "ggggggggg",
                "name": "Achievement 7",
                "description": "Description 7"
            },
            {
                "id": "hhhhhhhhh",
                "name": "Achievement 8",
                "description": "Description 8"
            },
            {
                "id": "iiiiiiiii",
                "name": "Achievement 9",
                "description": "Description 9"
            },
            {
                "id": "jjjjjjjjj",
                "name": "Achievement 10",
                "description": "Description 10"
            }
        ]

        for achievement in self.sample_achievements:
            self.achievements_table.put_item(Item=achievement)

        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "query_page_size": "5"
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("achievements", body["data"])
        self.assertEqual(len(body["data"]["achievements"]), 5)
        self.assertIn("next_token", body["data"])
        self.assertIsNotNone(body["data"]["next_token"])
        self.assertEqual(body["data"]["next_token"], json.dumps({"id": "eeeeeeeee"}))


    def test_get_achievements_with_next_token(self):
        """
        Test the get_achievements function with a next token.
        """

        self.sample_achievements = [
            {
                "id": "aaaaaaaaa",
                "name": "Achievement 1",
                "description": "Description 1"
            },
            {
                "id": "bbbbbbbbbb",
                "name": "Achievement 2",
                "description": "Description 2"
            },
            {
                "id": "ccccccccc",
                "name": "Achievement 3",
                "description": "Description 3"
            },
            {
                "id": "ddddddddd",
                "name": "Achievement 4",
                "description": "Description 4"
            },
            {
                "id": "eeeeeeeee",
                "name": "Achievement 5",
                "description": "Description 5"
            },
            {
                "id": "fffffffff",
                "name": "Achievement 6",
                "description": "Description 6"
            },
            {
                "id": "ggggggggg",
                "name": "Achievement 7",
                "description": "Description 7"
            },
            {
                "id": "hhhhhhhhh",
                "name": "Achievement 8",
                "description": "Description 8"
            },
            {
                "id": "iiiiiiiii",
                "name": "Achievement 9",
                "description": "Description 9"
            },
            {
                "id": "jjjjjjjjj",
                "name": "Achievement 10",
                "description": "Description 10"
            }
        ]

        for achievement in self.sample_achievements:
            self.achievements_table.put_item(Item=achievement)

        jwt_token = generate_jwt_token("test@mail.com")

        event = {
            'headers': {
                'Authorization': jwt_token
            },
            "queryStringParameters": {
                "query_page_size": "2",
                "next_token": json.dumps({"id": "ggggggggg"})
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("achievements", body["data"])
        self.assertEqual(len(body["data"]["achievements"]), 2)
        self.assertIn("next_token", body["data"])
        self.assertIsNotNone(body["data"]["next_token"])
        self.assertEqual(body["data"]["next_token"], json.dumps({"id": "iiiiiiiii"}))


    def tearDown(self):
        self.achievements_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path