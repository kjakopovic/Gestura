schema = {
    "type": "object",
    "properties": {
        "correct_answers_versions": {
            "type": "array",
            "minItems": 1,
            "items": {"type": "integer", "enum": [1, 2, 3]},
        },
        "started_at": {
            "type": "string",
            "format": "date-time",
            # Accepts only UTC timestamps in ISO 8601 format
            # Example: 2023-10-01T12:00:00Z or 2023-10-01T12:00:00.123456Z
            "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z$",
        },
        "finished_at": {
            "type": "string",
            "format": "date-time",
            # Accepts only UTC timestamps in ISO 8601 format
            # Example: 2023-10-01T12:00:00Z or 2023-10-01T12:00:00.123456Z
            "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z$",
        },
        "language_id": {
            "type": "string",
        },
        "letters_learned": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "string",
            },
        },
    },
    "required": [
        "correct_answers_versions",
        "started_at",
        "finished_at",
        "language_id",
        "letters_learned",
    ],
    "additionalProperties": False,
}
