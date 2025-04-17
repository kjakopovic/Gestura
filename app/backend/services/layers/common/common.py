import json
import bcrypt
import logging

logger = logging.getLogger("common")
logger.setLevel(logging.INFO)


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
