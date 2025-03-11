import boto3
import sys
import os

client = boto3.client("apigateway")

def get_api_gateway_id(api_name: str):
  response = client.get_rest_apis()
  
  for api in response["items"]:
    if api["name"] == api_name:
      return api["id"]
  
  return None

def export_api_to_swagger(backend_dir: str, api_id: str, api_name: str, stage_name: str):
  try:
    response = client.get_export(
      restApiId=api_id,
      stageName=stage_name,
      exportType="swagger",
      parameters={"extensions": "apigateway"}
    )
    swagger_json = response["body"].read().decode("utf-8")

    file_name = f"{api_name}.json"
    output_file = os.path.join(backend_dir, "docs", "utils", file_name)

    # Save to file
    with open(output_file, "w") as f:
      f.write(swagger_json)

    print(f"Swagger file saved at {output_file}")
  except Exception as e:
    print(f"Error exporting API to swagger: {e}")

def main():
  stage_name = sys.argv[1] if len(sys.argv) > 1 else "develop"

  # Determine the backend directory. This script is assumed to be in backend/scripts.
  script_dir = os.path.dirname(os.path.abspath(__file__))
  backend_dir = os.path.abspath(os.path.join(script_dir, ".."))
  backend_services_dir = os.path.join(backend_dir, "services")
  print(f"Backend directory: {backend_dir}")

  for service in os.listdir(backend_services_dir):
    service_path = os.path.join(backend_services_dir, service)

    if not os.path.isdir(service_path) or service.lower() in {"layers"}:
      continue

    print(f"Processing service: {service}")
    api_stage_name = f"{service.capitalize()}Api-{stage_name}"
    api_name = f"{service.capitalize()}Api"

    print(f"Getting API Id for API Name: {api_stage_name}")
    api_id = get_api_gateway_id(api_stage_name)

    if api_id:
      export_api_to_swagger(backend_dir, api_id, api_name, stage_name)
    else:
      print("API Gateway not found.")

if __name__ == "__main__":
  main()