#!/usr/bin/env python3
import json
import argparse
import sys
from decimal import Decimal
from boto3.dynamodb.types import TypeDeserializer


def load_raw_items(path):
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    if isinstance(raw, dict) and "Items" in raw and isinstance(raw["Items"], list):
        return raw["Items"]
    elif isinstance(raw, list):
        return raw
    else:
        sys.exit("Error: JSON must be either a dict with 'Items' or a list.")


def convert_items(dynamo_items):
    deserializer = TypeDeserializer()
    plain = []
    for i, item in enumerate(dynamo_items):
        if not isinstance(item, dict):
            sys.exit(f"Error: item at index {i} is not a dict.")
        plain_item = {}
        for key, val in item.items():
            try:
                plain_item[key] = deserializer.deserialize(val)
            except Exception as e:
                sys.exit(f"Error deserializing key '{key}' of item {i}: {e}")
        plain.append(plain_item)
    return plain


def decimal_to_native(obj):
    """
    JSON serializer for objects not serializable by default json code.
    Converts Decimal → int (if no fractional part) or float.
    """
    if isinstance(obj, Decimal):
        # preserve integer decimals as int
        if obj == obj.to_integral_value():
            return int(obj)
        else:
            return float(obj)
    raise TypeError(f"Type {obj.__class__.__name__} not serializable")


def write_plain_items(plain_items, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(
            plain_items, f, ensure_ascii=False, indent=2, default=decimal_to_native
        )


def main():
    parser = argparse.ArgumentParser(
        description="Convert DynamoDB JSON export into a plain JSON list."
    )
    parser.add_argument(
        "-i",
        "--input",
        required=True,
        help="Raw DynamoDB JSON file (AWS CLI scan output or list).",
    )
    parser.add_argument(
        "-o",
        "--output",
        required=True,
        help="Destination path for the plain JSON list.",
    )
    args = parser.parse_args()

    print(f"Loading raw items from {args.input}...")
    raw_items = load_raw_items(args.input)

    print(f"Converting {len(raw_items)} items to plain Python types…")
    plain = convert_items(raw_items)

    print(f"Writing {len(plain)} plain items to {args.output}…")
    write_plain_items(plain, args.output)

    print("Done!")


if __name__ == "__main__":
    main()
