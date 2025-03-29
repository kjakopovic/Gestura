from boto3 import resource
from os import environ

_LAMBDA_USERS_TABLE_RESOURCE = {
  "resource" : resource('dynamodb'),
  "table_name" : environ.get("USERS_TABLE_NAME", "test_table")
}

class LambdaDynamoDBClass:
  """
  AWS DynamoDB Resource Class
  """
  def __init__(self, lambda_dynamodb_resource):
    """
    Initialize a DynamoDB Resource
    """
    self.resource = lambda_dynamodb_resource["resource"]
    self.table_name = lambda_dynamodb_resource["table_name"]
    self.table = self.resource.Table(self.table_name)