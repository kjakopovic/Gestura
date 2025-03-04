#!/usr/bin/env python3
import sys
import json
import os
import boto3

def load_json_file(filepath):
  """Load and return JSON data from a file."""
  try:
    with open(filepath, 'r') as f:
      return json.load(f)
  except Exception as e:
    print(f"Error reading file {filepath}: {e}")
    return None

def save_json_file(data, filepath):
  """Save JSON data to a file with pretty printing."""
  try:
    with open(filepath, 'w') as f:
      json.dump(data, f, indent=2)
    print(f"New swagger file saved to: {filepath}")
  except Exception as e:
    print(f"Error saving file to {filepath}: {e}")

def merge_paths(existing_paths, new_paths):
  """
  Merge new_paths into existing_paths.
  If a key exists in both, merge their HTTP methods together.
  """
  for path, operations in new_paths.items():
    if path in existing_paths:
      for method, details in operations.items():
        if method in existing_paths[path]:
          # Merge details: update existing method details with new ones.
          existing_paths[path][method].update(details)
        else:
          existing_paths[path][method] = details
    else:
      existing_paths[path] = operations
  
  return existing_paths

def process_swagger_files(service_path, swagger_obj):
  """
  Walk through service_path (excluding 'tests' directories) and merge all 
  swagger.json files (found in a 'docs' subdirectory) into swagger_obj["paths"].
  """
  for root, dirs, files in os.walk(service_path):
    # Exclude any directory named "tests" from traversal.
    dirs[:] = [d for d in dirs if d.lower() != 'tests']
    swagger_file = os.path.join(root, "docs", "swagger.json")
    if os.path.isfile(swagger_file):
      print(f"Found swagger file in: {root}")
      
      swagger_data = load_json_file(swagger_file)
      if swagger_data is None:
        continue
      
      paths_data = swagger_data.get("paths")
      if not paths_data:
        print(f"'paths' key not found in {swagger_file}")
        continue
      
      merge_paths(swagger_obj["paths"], paths_data)
  
  return swagger_obj

def prepare_output_directory(backend_dir):
  """Ensure the output directory exists and return its path."""
  output_dir = os.path.join(backend_dir, "docs", "utils")
  os.makedirs(output_dir, exist_ok=True)
  
  return output_dir

def load_swagger_template(backend_dir):
  """Load the swagger template from backend/utils/swagger_template.json."""
  template_path = os.path.join(backend_dir, "utils", "swagger_template.json")
  print(f"Loading template swagger file from {template_path}")
  
  swagger_template = load_json_file(template_path)
  if swagger_template is None:
    sys.exit(1)
  
  return swagger_template

def process_service(service_path, swagger_template, output_dir, stage_name):
  """
  Process a single service:
    - Merge swagger files found under service_path
    - Update the template info section with dynamic values
    - Save the merged swagger file to the output directory
  """
  service_name = os.path.basename(os.path.normpath(service_path))
  new_swagger_file = swagger_template.copy()
  if "paths" not in new_swagger_file:
    new_swagger_file["paths"] = {}
  
  # Merge swagger files for this service
  new_swagger_file = process_swagger_files(service_path, new_swagger_file)
  
  # Update info with dynamic values
  new_swagger_file['info']['title'] = service_name
  new_swagger_file['info']['description'] = f"Public API documentation for {service_name} on stage {stage_name}"
  new_swagger_file['host'] = get_host_url_for_lambda_service(service_name, stage_name)
  
  # Save the merged swagger file
  output_file = os.path.join(output_dir, f"{service_name}.json")
  save_json_file(new_swagger_file, output_file)

def transform_service_name(name: str) -> str:
  """
  Transform a service name from kebab-case or lowercase to PascalCase.
  
  Examples:
    "golang-testing" -> "GolangTestingApi"
    "users" -> "UsersApi"
  """
  # Split the name by hyphen
  parts = name.split("-")

  # Capitalize the first letter of each part and join them together
  transformed_name = "".join(part.capitalize() for part in parts)
  return f"{transformed_name}Api"

def get_host_url_for_lambda_service(service_name, stage_name):
  """Return the host URL for a service deployed on AWS Lambda."""
  default_api_value = "localhost:8000"

  try:
    cf = boto3.client('cloudformation')
    response = cf.describe_stacks(StackName=f"{service_name}-{stage_name}")
    outputs = response["Stacks"][0]["Outputs"]

    api_name = transform_service_name(service_name)
    api = next((item["OutputValue"] for item in outputs if item["OutputKey"] == api_name), None)
    if not api:
      print(f"API Gateway URL not found in CloudFormation stack {service_name}")
      api = default_api_value
  except Exception as e:
    print(f"Error getting API Gateway URL for {service_name}: {e}")
    api = default_api_value
  
  return api

def process_all_services(backend_dir, stage_name, services_to_skip={}):
  """
  Iterate over each service directory in the backend folder (excluding 'scripts', 'docs', 'utils')
  and process each one.
  """
  backend_services_dir = os.path.join(backend_dir, "services")

  swagger_template = load_swagger_template(backend_dir)
  output_dir = prepare_output_directory(backend_dir)
  
  for item in os.listdir(backend_services_dir):
    item_path = os.path.join(backend_services_dir, item)
    
    if os.path.isdir(item_path) and item not in services_to_skip:
      print(f"\nProcessing service: {item_path}")
      
      process_service(item_path, swagger_template, output_dir, stage_name)

def main():
  stage_name = sys.argv[1] if len(sys.argv) > 1 else "develop"

  # Determine the backend directory. This script is assumed to be in backend/scripts.
  script_dir = os.path.dirname(os.path.abspath(__file__))
  backend_dir = os.path.abspath(os.path.join(script_dir, ".."))
  print(f"Backend directory: {backend_dir}")
  
  # Process all service directories in backend
  process_all_services(backend_dir, stage_name, {"scripts", "docs", "utils"})

if __name__ == "__main__":
  main()
