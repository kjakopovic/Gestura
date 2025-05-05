from datetime import datetime
import json
import bcrypt
import logging
from decimal import Decimal

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


def convert_decimal_to_float(obj: Any) -> Any:
    """
    In-place convert every Decimal anywhere inside obj (dicts/lists mixed),
    without using recursion.
    """
    # Use a stack of (parent, key_or_index, value_to_process)
    # parent = None/key means top-level
    stack = [(None, None, obj)]

    while stack:
        parent, key, current = stack.pop()

        # If it's a Decimal, replace it with float in its parent container
        if isinstance(current, Decimal):
            new_val = float(current)
            if parent is None:
                # top-level Decimal → we just return it
                return new_val
            parent[key] = new_val
            continue

        # If it's a dict, push its children onto the stack
        if isinstance(current, dict):
            for k, v in current.items():
                # only push those needing conversion/scan
                if isinstance(v, (Decimal, dict, list)):
                    stack.append((current, k, v))
            continue

        # If it's a list, push its elements onto the stack
        if isinstance(current, list):
            for idx, v in enumerate(current):
                if isinstance(v, (Decimal, dict, list)):
                    stack.append((current, idx, v))
            continue

        # otherwise (int, str, etc.) we do nothing

    return obj
