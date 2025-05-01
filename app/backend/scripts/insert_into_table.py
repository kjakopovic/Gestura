import boto3
from botocore.exceptions import ClientError


def bulk_insert(table_name, items, region_name="us-west-2"):
    """
    Insert multiple items into a DynamoDB table using batch_writer.

    :param table_name: Name of the DynamoDB table.
    :param items: List of dictionaries, each representing an item to insert.
    :param region_name: AWS region where the table is located.
    """
    # Initialize a session using Amazon DynamoDB
    dynamodb = boto3.resource("dynamodb", region_name=region_name)
    table = dynamodb.Table(table_name)

    # Use batch_writer for efficient bulk writes
    with table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)

    print(f"Successfully inserted {len(items)} items into '{table_name}' table.")


if __name__ == "__main__":
    import json
    import argparse

    parser = argparse.ArgumentParser(
        description="Bulk insert items into a DynamoDB table."
    )
    parser.add_argument("--table", required=True, help="DynamoDB table name")
    parser.add_argument(
        "--items-file", required=True, help="Path to JSON file containing list of items"
    )
    parser.add_argument(
        "--region", default="eu-central-1", help="AWS region (default: eu-central-1)"
    )
    args = parser.parse_args()

    # Load items from JSON file
    with open(args.items_file, "r") as f:
        try:
            items = json.load(f)
            if not isinstance(items, list):
                raise ValueError("JSON file must contain a list of items.")
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error reading items file: {e}")
            exit(1)

    # Perform bulk insert
    try:
        bulk_insert(args.table, items, args.region)
    except ClientError as e:
        print(f"Error inserting items: {e.response['Error']['Message']}")
        exit(1)
