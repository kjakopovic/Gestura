from aws_lambda_powertools.middleware_factory import lambda_handler_decorator
from common import build_response
from auth import get_expiration_time, get_email_from_refresh_token
from datetime import timedelta
from os import environ
from boto import get_secrets_from_aws_secrets_manager
import logging
import jwt

logger = logging.getLogger("middleware")
logger.setLevel(logging.DEBUG)


@lambda_handler_decorator
def middleware(handler, event, context):
    event_headers = event.get("headers")
    authorization = event_headers.get("Authorization") or event_headers.get(
        "authorization"
    )

    if not authorization:
        logger.info("Authorization header not found, returning to the client")

        return build_response(401, {"message": "Authorization header not found"})

    access_token = (
        authorization.split(" ")[1] if " " in authorization else authorization
    )
    refresh_token = event_headers.get("x-refresh-token")

    logger.info(f"Received event in the middleware: {event_headers}")

    result = validate_jwt_token(access_token, refresh_token)

    if result["statusCode"] != 200:
        logger.info("JWT token validation failed, returning to the client")

        return result

    logger.info("JWT token validation passed, continuing to the handler")

    try:
        logger.debug(f"Authorization header: {authorization}")

        event["headers"]["x-access-token"] = access_token

        event["headers"].pop("Authorization", None)
        event["headers"].pop("authorization", None)

        return handler(event, context)
    except TypeError as e:
        logger.error(f"Error in the handler: {e}")

        return build_response(422, {"message": f"Invalid request body: {e}"})
    except Exception as e:
        logger.error(f"Error in the handler: {e}")

        return build_response(500, {"message": "Internal server error"})


def validate_refresh_token(refresh_token, refresh_secret, jwt_secret):
    try:
        logger.debug("Verifying refresh token")
        jwt.decode(refresh_token, refresh_secret, algorithms=["HS256"])

        logger.info("Refresh token verified successfully, creating new JWT token")
        expiration_time = get_expiration_time(timedelta(hours=1))
        user_email = get_email_from_refresh_token(refresh_token)
        new_jwt_token = jwt.encode(
            {"email": user_email, "exp": expiration_time}, jwt_secret, algorithm="HS256"
        )

        logger.info(f"New JWT token created successfully for email: {user_email}")
        return build_response(
            200,
            {"message": "JWT token verified successfully"},
            {"x-access-token": new_jwt_token, "Content-Type": "application/json"},
        )
    except Exception as e:
        logger.error(f"Error verifying refresh token: {e}")

        return build_response(401, {"message": "Token expired"})


def validate_jwt_token(access_token, refresh_token):
    logger.info(f"Validating JWT token: {access_token}")

    logger.debug(f"Secret name: {environ.get("JWT_SECRET_NAME")}")
    logger.debug(f"Region name: {environ.get("SECRETS_REGION_NAME")}")
    secrets = get_secrets_from_aws_secrets_manager(
        environ.get("JWT_SECRET_NAME"), environ.get("SECRETS_REGION_NAME")
    )

    try:
        logger.debug("Verifying JWT token")
        jwt.decode(
            access_token.encode("utf-8"), secrets["jwt_secret"], algorithms=["HS256"]
        )

        logger.info("JWT token verified successfully, continuing to the handler")

        return {"statusCode": 200}

    except jwt.ExpiredSignatureError:
        logger.info("JWT token expired, verifying refresh token")
        return validate_refresh_token(
            refresh_token, secrets["refresh_secret"], secrets["jwt_secret"]
        )

    except Exception as e:
        logger.error(f"Error verifying JWT token: {e}")

        return build_response(401, {"message": "Invalid token, please login again"})
