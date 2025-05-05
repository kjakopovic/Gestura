import json
import sys
import os
import unittest
from unittest.mock import patch
from datetime import datetime, timedelta, timezone
from base_test_setup import BaseTestSetup
from decimal import Decimal


original_path = sys.path.copy()
BaseTestSetup.setup_paths('consumeItem')
BaseTestSetup.clear_module_cache(['common', 'consumeItem.app'])


from base_test_setup import BaseTestSetup
from moto import mock_aws
from consumeItem.app import lambda_handler
from auth import generate_jwt_token


@mock_aws
class TestConsumeItem(BaseTestSetup):
    def setUp(self):
        super().setUp()

        # Create patcher for the DynamoDB resource in the lambda handler
        self.users_resource_patcher = patch('consumeItem.app._LAMBDA_USERS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["USERS_TABLE_NAME"]
        })
        self.items_resource_patcher = patch('consumeItem.app._LAMBDA_ITEMS_TABLE_RESOURCE', {
            "resource": self.dynamodb,
            "table_name": os.environ["ITEMS_TABLE_NAME"]
        })

        self.items_resource_patcher.start()
        self.users_resource_patcher.start()


    def test_validation_schema(self):
        """
        Test response when the validation schema is not met.
        """
        jwt_token = generate_jwt_token("test@mail.com")

        test_cases = [
            {
                "request_query": {},
                "expected_validation_message": "Failed schema validation. Error: data must contain ['item_id'] properties"
            },
            {
                "request_query": {"item_id": 213},
                "expected_validation_message": "Failed schema validation. Error: data.item_id must be string"
            },
            {
                "request_query": {
                    "item_id": "item-1",
                    "extra_param": "extra_value"
                },
                "expected_validation_message": "Failed schema validation. Error: data must not contain {'extra_param'} properties"
            }
        ]

        for case in test_cases:
            with self.subTest(request_query=case["request_query"],
                              expected_status_code=case["expected_validation_message"]):
                event = {
                    'headers': {
                        'Authorization': jwt_token
                    },
                    "queryStringParameters": case["request_query"]
                }

                response = lambda_handler(event, {})
                body = json.loads(response['body'])

                self.assertEqual(response['statusCode'], 400)
                self.assertIn(case["expected_validation_message"], body['message'])



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


    def test_user_not_found(self):
        """
        Test response when user is not found.
        """
        jwt_token = generate_jwt_token("random@mail.com")

        event = {
            'headers': {'Authorization': jwt_token},
            'queryStringParameters': {
                'item_id': 'item123'
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 404)
        self.assertIn("message", body)
        self.assertEqual(body['message'], "User not found")


    def test_item_not_found_in_inventory(self):
        """
        Test response when item is not found in user's inventory.
        """

        email = "test@mail.com"
        jwt_token = generate_jwt_token(email)

        event = {
            'headers': {'Authorization': jwt_token},
            'queryStringParameters': {
                'item_id': 'item-2'
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 404)
        self.assertIn("message", body)
        self.assertEqual(body['message'], "Item not found in user's inventory.")


    def test_item_not_in_items_table(self):
        """
        Test response when item is not found in items table.
        """
        self.users_table.put_item(Item={
            "email": "randomitem@mail.com",
            "items_inventory": [
                {
                    "item_id": "item-1",
                    "quantity": 2,
                    "acquired_date": "2023-06-15T12:30:00Z"
                },
                {
                    "item_id": "item-3",
                    "quantity": 1,
                    "acquired_date": "2023-07-20T09:45:00Z"
                },
                {
                    "item_id": "chest-1",
                    "quantity": 3,
                    "acquired_date": "2023-08-05T18:20:00Z"
                },
                {
                    "item_id": "coins-1",
                    "quantity": 5,
                    "acquired_date": "2023-09-10T14:15:00Z"
                },
                {
                    "item_id": "random_item"
                }
            ],
        })

        email = "randomitem@mail.com"
        jwt_token = generate_jwt_token(email)

        event = {
            'headers': {'Authorization': jwt_token},
            'queryStringParameters': {
                'item_id': 'random_item'
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 404)
        self.assertIn("message", body)
        self.assertEqual(body['message'], "Item not found in items table.")


    def test_user_has_full_hearts(self):
        """
        Test response when user has full hearts.
        """
        email = "test@mail.com"

        jwt_token = generate_jwt_token(email)

        event = {
            'headers': {'Authorization': jwt_token},
            'queryStringParameters': {
                'item_id': 'item-1'
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 400)
        self.assertIn("message", body)
        self.assertEqual(body['message'], "User already has maximum hearts.")


    def test_user_has_no_hearts(self):
        """
        Test consume item that fills all user hearts.
        """
        self.new_user = {
            "email": "new@mail.com",
            "hearts": 0,
            "items_inventory": [
                {
                    "item_id": "item-1",
                    "quantity": 1
                }
            ]
        }

        self.users_table.put_item(Item=self.new_user)

        jwt_token = generate_jwt_token("new@mail.com")

        event = {
            'headers': {'Authorization': jwt_token},
            'queryStringParameters': {
                'item_id': 'item-1'
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertIn("message", body)
        self.assertEqual(body["message"], "Item consumed successfully.")

        fetched_user = self.users_table.get_item(Key={'email': "new@mail.com"})['Item']

        self.assertEqual(fetched_user["hearts"], 5)

    def test_consume_xp_boost_item(self):
        """
        Test consuming an item that gives XP boost to the user.
        """
        # Create a new user with an XP boost item in inventory
        self.xp_boost_user = {
            "email": "xpboost@mail.com",
            "xp": Decimal('100'),
            "items_inventory": [
                {
                    "item_id": "xp-boost-1",
                    "quantity": Decimal('1')
                }
            ],
            "activated_items": []
        }

        # Create the XP boost item in the items table
        self.xp_boost_item = {
            "id": "xp-boost-1",
            "name": "XP Booster",
            "image_url": "https://example.com/images/xp_boost.png",
            "price": Decimal('150.00'),
            "category": "xp_boost",
            "effect": {
                "multiplier": Decimal('2'),
                "seconds_in_use": Decimal('3600')  # 1 hour duration
            }
        }

        # Add the user and item to their respective tables
        self.users_table.put_item(Item=self.xp_boost_user)
        self.items_table.put_item(Item=self.xp_boost_item)

        jwt_token = generate_jwt_token("xpboost@mail.com")

        event = {
            'headers': {'Authorization': jwt_token},
            'queryStringParameters': {
                'item_id': 'xp-boost-1'
            }
        }

        response = lambda_handler(event, {})
        body = json.loads(response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(body["message"], "Item consumed successfully.")

        # Fetch the updated user to verify changes
        fetched_user = self.users_table.get_item(Key={'email': "xpboost@mail.com"})['Item']

        # Check that the item was removed from inventory
        self.assertEqual(len(fetched_user["items_inventory"]), 0)

        # Check that the item was added to activated_items
        self.assertEqual(len(fetched_user["activated_items"]), 1)

        activated_item = fetched_user["activated_items"][0]
        self.assertEqual(activated_item["category"], "xp_boost")
        self.assertEqual(activated_item["effects"]["multiplier"], Decimal('2'))

        # Check that the expires_at timestamp is roughly 1 hour in the future
        # Parse the ISO format timestamp
        expires_at = datetime.fromisoformat(activated_item["expires_at"])
        now = datetime.now(timezone.utc)
        time_diff = expires_at - now

        # Allow a small margin of error (10 seconds) for test execution time
        self.assertTrue(3590 <= time_diff.total_seconds() <= 3610)


    def test_won_coins_chest(self):
        """
        Test consuming a chest item that gives coins to the user.
        """
        self.coins_chest_user = {
            "email": "chestuser@mail.com",
            "coins": Decimal('100'),
            "items_inventory": [
                {
                    "item_id": "coins-chest-1",
                    "quantity": Decimal('1')
                }
            ],
            "activated_items": []
        }

        self.coins_chest = {
            "id": "coins-chest-1",
            "name": "Coins Chest",
            "image_url": "https://example.com/images/coins_chest.png",
            "price": Decimal('150.00'),
            "category": "chest",
            "effect": {
                "items": [
                    {
                        "coins": 10,
                        "win_percentage": 50
                    },
                    {
                        "coins": 20,
                        "win_percentage": 30
                    },
                    {
                        "coins": 50,
                        "win_percentage": 20
                    }
                ]
            }
        }

        self.users_table.put_item(Item=self.coins_chest_user)
        self.items_table.put_item(Item=self.coins_chest)

        jwt_token = generate_jwt_token("chestuser@mail.com")

        event = {
            'headers': {
                'Authorization': jwt_token,
            },
            'queryStringParameters': {
                'item_id': 'coins-chest-1'
            }
        }

        # Mock random.choices to always return the 50-coin reward
        with patch('random.choices') as mock_choices:
            mock_choices.return_value = [self.coins_chest["effect"]["items"][2]]

            response = lambda_handler(event, {})
            body = json.loads(response['body'])

            self.assertEqual(response['statusCode'], 200)
            self.assertEqual(body["message"], "Item consumed successfully.")

            fetched_user = self.users_table.get_item(Key={'email': "chestuser@mail.com"})['Item']
            self.assertEqual(fetched_user["coins"], Decimal('150'))
            self.assertEqual(len(fetched_user["items_inventory"]), 0)


    def test_won_item_from_chest(self):
        """
        Test consuming a chest item that gives a new item to the user's inventory.
        """
        self.items_chest_user = {
            "email": "itemchestuser@mail.com",
            "coins": Decimal('100'),
            "items_inventory": [
                {
                    "item_id": "items-chest-1",
                    "quantity": Decimal('1')
                }
            ],
            "activated_items": []
        }

        # Create the item that will be won from the chest
        self.reward_item = {
            "id": "xp-boost-1",
            "name": "XP Booster",
            "image_url": "https://example.com/images/xp_boost.png",
            "price": Decimal('150.00'),
            "category": "xp_boost",
            "effect": {
                "multiplier": Decimal('2'),
                "seconds_in_use": Decimal('3600')
            }
        }

        # Create chest with possible rewards
        self.items_chest = {
            "id": "items-chest-1",
            "name": "Items Chest",
            "image_url": "https://example.com/images/items_chest.png",
            "price": Decimal('200.00'),
            "category": "chest",
            "effect": {
                "items": [
                    {
                        "coins": 10,
                        "win_percentage": Decimal('40')
                    },
                    {
                        "item_id": "xp-boost-1",
                        "win_percentage": Decimal('60')
                    }
                ]
            }
        }

        # Add items to the tables
        self.users_table.put_item(Item=self.items_chest_user)
        self.items_table.put_item(Item=self.items_chest)
        self.items_table.put_item(Item=self.reward_item)

        jwt_token = generate_jwt_token("itemchestuser@mail.com")

        event = {
            'headers': {'Authorization': jwt_token},
            'queryStringParameters': {
                'item_id': 'items-chest-1'
            }
        }

        # Mock random.choices to always return the non-coin item
        with patch('random.choices') as mock_choices:
            mock_choices.return_value = [self.items_chest["effect"]["items"][1]]

            response = lambda_handler(event, {})
            body = json.loads(response['body'])

            self.assertEqual(response['statusCode'], 200)
            self.assertEqual(body["message"], "Item consumed successfully.")

            # Fetch the updated user to verify changes
            fetched_user = self.users_table.get_item(Key={'email': "itemchestuser@mail.com"})['Item']

            # Verify the chest was removed from inventory
            # Find the chest in the inventory
            chest_in_inventory = next((item for item in fetched_user["items_inventory"]
                                       if item["item_id"] == "items-chest-1"), None)
            self.assertIsNone(chest_in_inventory)

            # Verify the new item was added to inventory
            xp_boost_in_inventory = next((item for item in fetched_user["items_inventory"]
                                          if item["item_id"] == "xp-boost-1"), None)
            self.assertIsNotNone(xp_boost_in_inventory)
            self.assertEqual(xp_boost_in_inventory["quantity"], Decimal('1'))

            # Check that the user now has two items in inventory (the new one)
            self.assertEqual(len(fetched_user["items_inventory"]), 1)


    def tearDown(self):
        self.users_resource_patcher.stop()
        self.items_resource_patcher.stop()
        super().tearDown()


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        sys.path = original_path