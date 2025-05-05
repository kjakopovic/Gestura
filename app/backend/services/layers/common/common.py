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


def convert_decimals(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_decimals(v) for v in obj]
    return obj


def convert_decimal_to_float(obj):
    """
    In-place convert any Decimal values up to 4 dict-levels deep into floats.
    Lists are only scanned one level deep.
    """
    # Level 0 → dict or list or bare Decimal
    if isinstance(obj, dict):
        # Level 1
        for k1, v1 in obj.items():
            if isinstance(v1, Decimal):
                obj[k1] = float(v1)

            elif isinstance(v1, dict):
                # Level 2
                for k2, v2 in v1.items():
                    if isinstance(v2, Decimal):
                        v1[k2] = float(v2)

                    elif isinstance(v2, dict):
                        # Level 3
                        for k3, v3 in v2.items():
                            if isinstance(v3, Decimal):
                                v2[k3] = float(v3)

                            elif isinstance(v3, dict):
                                # Level 4
                                for k4, v4 in v3.items():
                                    if isinstance(v4, Decimal):
                                        v3[k4] = float(v4)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            if isinstance(v, Decimal):
                obj[i] = float(v)
            # Level 0 → dict or list or bare Decimal
            if isinstance(obj, dict):
                # Level 1
                for k1, v1 in obj.items():
                    if isinstance(v1, Decimal):
                        obj[k1] = float(v1)

                    elif isinstance(v1, dict):
                        # Level 2
                        for k2, v2 in v1.items():
                            if isinstance(v2, Decimal):
                                v1[k2] = float(v2)

                            elif isinstance(v2, dict):
                                # Level 3
                                for k3, v3 in v2.items():
                                    if isinstance(v3, Decimal):
                                        v2[k3] = float(v3)

                                    elif isinstance(v3, dict):
                                        # Level 4
                                        for k4, v4 in v3.items():
                                            if isinstance(v4, Decimal):
                                                v3[k4] = float(v4)
    elif isinstance(obj, Decimal):
        return float(obj)

    return obj


def convert_decimal_to_float_object(obj: dict):
    for k, v in obj.items():
        if isinstance(v, Decimal):
            obj[k] = float(v)

    return obj
