import logging
import jwt
from os import environ
from datetime import datetime, timedelta, timezone
from boto import get_secrets_from_aws_secrets_manager
from common import parse_utc_isoformat

logger = logging.getLogger("auth")
logger.setLevel(logging.INFO)


def generate_jwt_token(email):
    secrets = get_secrets_from_aws_secrets_manager(
        environ.get("JWT_SECRET_NAME"), environ.get("SECRETS_REGION_NAME")
    )

    expiration_time = get_expiration_time(timedelta(hours=1))

    logger.debug(f"Generating JWT token for email: {email}")

    return jwt.encode(
        {"email": email, "exp": expiration_time},
        secrets["jwt_secret"],
        algorithm="HS256",
    )


def generate_refresh_token(email):
    secrets = get_secrets_from_aws_secrets_manager(
        environ.get("JWT_SECRET_NAME"), environ.get("SECRETS_REGION_NAME")
    )

    logger.debug(f"Generating refresh token for email: {email}")

    expiration_time = get_expiration_time(timedelta(days=1))

    return jwt.encode(
        {"email": email, "exp": expiration_time},
        secrets["refresh_secret"],
        algorithm="HS256",
    )


def get_email_from_jwt_token(token):
    if not token:
        logger.warning("No token provided")
        return None

    secrets = get_secrets_from_aws_secrets_manager(
        environ.get("JWT_SECRET_NAME"), environ.get("SECRETS_REGION_NAME")
    )

    try:
        logger.debug("Decoding JWT token")
        decoded_jwt = jwt.decode(
            token.encode("utf-8"), secrets["jwt_secret"], algorithms=["HS256"]
        )
    except Exception as e:
        logger.error(f"Error decoding JWT token {e}")
        return None

    logger.debug("Returning email from the JWT token")
    return decoded_jwt.get("email")


def get_expiration_time(time: timedelta) -> int:
    return int((datetime.now(timezone.utc) + time).timestamp())


def check_users_subscription(user, wanted_status: int) -> bool:
    """
    Check if the user has a valid subscription status.
    :param user: User object to check the subscription status for.
    :param wanted_status: The subscription status to check against (0 -> free, 1 -> premium, 2 -> live).
    :return: True if the user has a valid subscription status, False otherwise.
    """

    if user is None:
        logger.warning("User is not found")
        return False

    subscription = user.get("subscription")
    if subscription is None:
        logger.warning("User subscription status is not found")
        return False

    exp_str = user.get("subscription_expiration_date")
    if not exp_str:
        logger.warning("User subscription_expiration_date is missing")
        return False

    try:
        exp_dt = parse_utc_isoformat(exp_str)
    except Exception as e:
        logger.error(f"Failed to parse subscription_expiration_date '{exp_str}': {e}")
        return False

    now = datetime.now(timezone.utc)

    if subscription < wanted_status:
        logger.info(
            f"User subscription ({subscription}) is below required ({wanted_status})"
        )
        return False

    if exp_dt < now:
        logger.info(
            f"Subscription expired at {exp_dt.isoformat()}, now is {now.isoformat()}"
        )
        return False
