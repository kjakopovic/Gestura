#!/usr/bin/env python3
import os
import subprocess

def main():
  # Determine the script directory and then the backend folder.
  # This script is assumed to be located in app/backend/scripts.
  script_dir = os.path.dirname(os.path.abspath(__file__))
  backend_dir = os.path.abspath(os.path.join(script_dir, ".."))
  backend_services_dir = os.path.join(backend_dir, "services")
  print(f"Backend directory: {backend_dir}")

  # Iterate over each directory in backend (service directories).
  for service in os.listdir(backend_services_dir):
    service_path = os.path.join(backend_services_dir, service)

    if not os.path.isdir(service_path):
      continue

    print(f"Processing service: {service}")

    # In your project, each service contains lambda directories (e.g. get-all, hello-world)
    # We iterate only over first-level subdirectories in the service folder.
    for lambda_dir in os.listdir(service_path):
      lambda_path = os.path.join(service_path, lambda_dir)
      if not os.path.isdir(lambda_path):
        continue
      # Exclude directories that are not lambda folders.
      if lambda_dir.lower() in {"docs", "tests"}:
        continue

      print(f"Running 'swag init' in: {lambda_path}")
      try:
        # Run 'swag init' in the lambda directory.
        subprocess.run(["swag", "init"], check=True, cwd=lambda_path)
      except subprocess.CalledProcessError as e:
        print(f"Error running swag init in {lambda_path}: {e}")

if __name__ == "__main__":
  main()