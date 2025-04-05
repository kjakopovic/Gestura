import os
import logging

logger = logging.getLogger("RequestThirdPartyLogin")
logger.setLevel(logging.DEBUG)

from constants import (
    GOOGLE_AUTHENTICATION_URL,
    GOOGLE_SCOPE,
    VALID_SERVICE_TYPES,
    VALID_PLATFORM_TYPES,
)

from common import build_response
from boto import get_secrets_from_aws_secrets_manager


def lambda_handler(event, context):
    logger.debug(f"Received event {event}")
    type_of_service = (
        event.get("queryStringParameters", {}).get("type_of_service").lower()
    )
    platform = event.get("queryStringParameters", {}).get("platform").lower()

    logger.info(
        f"Checking if the service type is valid: {type_of_service} and if the platform is valid: {platform}"
    )
    if (
        type_of_service not in VALID_SERVICE_TYPES
        or platform not in VALID_PLATFORM_TYPES
    ):
        return build_response(400, {"message": "Unsupported or missing service type"})

    logger.info("Retrieving secrets from AWS Secrets Manager")
    secrets = get_secrets_from_aws_secrets_manager(
        os.getenv("THIRD_PARTY_CLIENTS_SECRET_NAME"), os.getenv("SECRETS_REGION_NAME")
    )

    logger.info(f"Constructing authorization URL for {type_of_service}")
    try:
        redirect_uri = secrets["callback_uri"]

        if type_of_service == "google":
            authorization_url = (
                f"{GOOGLE_AUTHENTICATION_URL}?client_id={secrets['google_client_id']}&redirect_uri={redirect_uri}"
                f"&response_type=code&scope={GOOGLE_SCOPE}&state={type_of_service}_{platform}"
            )
    except Exception as e:
        logger.error(f"Failed to construct authorization URL: {str(e)}")
        return build_response(
            500, {"message": f"Failed to construct authorization URL: {str(e)}"}
        )

    return {
        "statusCode": 302,
        "headers": {
            "Location": authorization_url,
        },
    }
