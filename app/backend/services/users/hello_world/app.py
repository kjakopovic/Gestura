import json
from middleware import middleware


def lambda_handler(event, context):
    event = middleware(event, context)

    return {
        "statusCode": 200,
        "headers": {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*'
        },
        "body": json.dumps({
            "message": "hello world",
        }),
    }
