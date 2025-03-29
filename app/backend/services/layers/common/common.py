import json
import bcrypt

def build_response(status_code, body, headers=None):
  return {
    'statusCode': status_code,
    headers if headers else 'headers': {
        'Content-Type': 'application/json'
    },
    'body': json.dumps(body)
  }

def hash_string(password, salt_rounds=5):
  salt = bcrypt.gensalt(rounds=salt_rounds)
  return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
