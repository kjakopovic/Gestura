from common import build_response

def lambda_handler(event, context):
  return build_response(200, {'message': 'Shop service is running'})