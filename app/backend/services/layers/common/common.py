from datetime import datetime
import json
import bcrypt
import logging
from decimal import Decimal
from typing import Any, Union

logger = logging.getLogger("common")
logger.setLevel(logging.DEBUG)


def build_response(status_code, body, headers=None):
    default_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PUT,POST,PATCH",
    }

    if headers:
        default_headers.update(headers)

    response = {
        "statusCode": status_code,
        "headers": default_headers,
        "body": json.dumps(body),
    }

    logger.info(f"Response: {response}")

    return response


def hash_string(password, salt_rounds=5):
    salt = bcrypt.gensalt(rounds=salt_rounds)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_hash_string(string, hashed_string):
    logger.info("Verifying hash")
    return bcrypt.checkpw(string.encode("utf-8"), hashed_string.encode("utf-8"))


def parse_utc_isoformat(ts: str) -> datetime:
    """
    Parse an ISO‑8601 UTC timestamp ending in 'Z' into
    a timezone‑aware datetime in UTC.
    e.g. "2025-04-18T14:30:00Z" or "2025-04-18T14:30:00.123456Z"
    """
    if not isinstance(ts, str):
        raise ValueError(f"Expected string for timestamp, got {type(ts)}")

    # Replace trailing Z with +00:00 so fromisoformat can handle it
    if ts.endswith("Z"):
        ts = ts[:-1] + "+00:00"

    return datetime.fromisoformat(ts)


def convert_decimal_to_float(obj: Union[dict, list]) -> Union[dict, list]:
    """
    In-place: convert any Decimal values in the top level of
    `obj` (dict or list) into floats.
    """
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, Decimal):
                obj[k] = float(v)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            if isinstance(v, Decimal):
                obj[i] = float(v)
    elif isinstance(obj, Decimal):
        return float(obj)

    return obj
