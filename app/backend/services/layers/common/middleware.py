from aws_lambda_powertools.middleware_factory import lambda_handler_decorator
import logging

logger = logging.getLogger("middleware")
logger.setLevel(logging.INFO)

@lambda_handler_decorator
def lambda_middleware(handler, event, context):
  event_headers = event.get('headers')
  logger.info(f"Received event in the middleware: {event_headers}")

  # result = validate_jwt_token(event_headers)

  if result['statusCode'] != 200:
    logger.info("JWT token validation failed, returning to the client")

    return result

  logger.info("JWT token validation passed, continuing to the handler")

  try:
    authorization = event_headers.get('Authorization') or event_headers.get('authorization')

    logger.debug(f"Authorization header: {authorization}")

    if authorization:
        access_token = authorization.split(' ')[1] if ' ' in authorization else authorization
        event['headers']['x-access-token'] = access_token

        event['headers'].pop('Authorization', None)
        event['headers'].pop('authorization', None)

    return handler(event, context)
  except TypeError as e:
    logger.error(f"Error in the handler: {e}")

    return build_response(
        400,
        {
            "message": f"Invalid request body: {e}"
        }
    )
  except Exception as e:
    logger.error(f"Error in the handler: {e}")

    return build_response(
        500,
        {
            "message": "Internal server error"
        }
    )