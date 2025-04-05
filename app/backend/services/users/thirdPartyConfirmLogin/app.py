import os
import requests
import logging

from os import environ

logger = logging.getLogger("ConfirmThirdPartyLogin")
logger.setLevel(logging.DEBUG)

from constants import (
    GOOGLE_TOKEN_URL,
    GOOGLE_USER_INFO_URL,
)

from common import build_response
from boto import (
    LambdaDynamoDBClass,
    _LAMBDA_USERS_TABLE_RESOURCE,
    get_secrets_from_aws_secrets_manager,
)
from auth import generate_jwt_token, generate_refresh_token


def lambda_handler(event, context):
    logger.debug(f"Received event {event}")

    query_params = event.get("queryStringParameters", {})
    code = query_params.get("code")
    state = query_params.get("state")
    service, platform = state.split("_")

    logger.info(f"Checking if code and state parameters are present: {code}, {state}")

    if not code or not state:
        return build_response(400, {"message": "Missing code or state parameter"})

    # Setting up table for users
    global _LAMBDA_USERS_TABLE_RESOURCE
    dynamodb = LambdaDynamoDBClass(_LAMBDA_USERS_TABLE_RESOURCE)

    logger.info("Retrieving secrets from AWS Secrets Manager")
    secrets = get_secrets_from_aws_secrets_manager(
        os.getenv("THIRD_PARTY_CLIENTS_SECRET_NAME"), os.getenv("SECRETS_REGION_NAME")
    )

    logger.debug(f"Determining URLs and parameters based on state: {state}")
    token_url = user_info_url = None
    client_id_key = client_secret_key = None
    headers = {"Accept": "application/json"}

    if service == "google":
        token_url = GOOGLE_TOKEN_URL
        user_info_url = GOOGLE_USER_INFO_URL
        client_id_key = secrets["google_client_id"]
        client_secret_key = secrets["google_client_secret"]
    else:
        logger.error(f"Unsupported state parameter {service}")
        return build_response(400, {"message": "Unsupported state parameter"})

    logger.info("Requesting access token from third party service")
    payload = {
        "code": code,
        "client_id": client_id_key,
        "client_secret": client_secret_key,
        "redirect_uri": secrets["callback_uri"],
        "grant_type": "authorization_code",
    }

    token_response = requests.post(token_url, data=payload, headers=headers)
    token_response.raise_for_status()
    access_token = token_response.json().get("access_token")

    if not access_token:
        return build_response(400, {"message": "Failed to obtain access token"})

    logger.info("Fetching user information")
    headers = {"Authorization": f"Bearer {access_token}"}
    user_info_response = requests.get(user_info_url, headers=headers)
    user_info_response.raise_for_status()
    user_info = user_info_response.json()

    logger.info("Extracting user information")
    user_name = user_info.get("name").split(" ")
    user_email = user_info.get("email")

    # If user doesn't exist, register him and login, else just login
    is_user_found = check_if_user_exists(dynamodb, user_email)

    if not is_user_found:
        logger.info("User does not exist, creating a new user")

        if len(user_name) >= 2:
            username = f"{user_name[0]}_{user_name[1]}"
        else:
            username = user_email.split("@")[
                0
            ]  # Fallback to email prefix if name is not valid

        add_user_to_the_table(
            dynamodb,
            {
                "email": user_email,
                "username": username,
            },
        )

    logger.info("Generating tokens")
    token = generate_jwt_token(user_email)
    refresh_token = generate_refresh_token(user_email)

    frontend_url = ""
    if platform == "web":
        frontend_url = environ.get("FRONTEND_CALLBACK_URL", "http://localhost:5173")
    elif platform == "mobile":
        frontend_url = environ.get("MOBILE_CALLBACK_URL", "http://localhost:3000")

    return {
        "statusCode": 302,
        "headers": {
            "Location": f"{frontend_url}/callback?token={token}&refresh_token={refresh_token}"
        },
    }


def check_if_user_exists(dynamodb, email):
    logger.info(f"Checking if user with email {email} exists")
    response = dynamodb.table.get_item(Key={"email": email})

    return response.get("Item")


def add_user_to_the_table(dynamodb, user_item):
    logger.info(f"Adding user {user_item} to the table.")

    dynamodb.table.put_item(Item=user_item)
