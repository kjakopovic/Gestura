import json
import bcrypt
import logging

logger = logging.getLogger("common")
logger.setLevel(logging.INFO)

def build_response(status_code, body, headers=None):
  return {
    'statusCode': status_code,
    headers if headers else 'headers': {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*'
    },
    'body': json.dumps(body)
  }

def hash_string(password, salt_rounds=5):
  salt = bcrypt.gensalt(rounds=salt_rounds)
  return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_hash_string(string, hashed_string):
  logger.info('Verifying hash')
  return bcrypt.checkpw(string.encode('utf-8'), hashed_string.encode('utf-8'))
