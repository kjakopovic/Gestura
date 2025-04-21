schema = {
    "type": "object",
    "properties": {
        "correctAnswersVersions": {
            "type": "array",
            "minItems": 1,
            "items": {"type": "integer", "enum": [1, 2, 3]},
        },
        "startedAt": {
            "type": "string",
            "format": "date-time",
            # Accepts only UTC timestamps in ISO 8601 format
            # Example: 2023-10-01T12:00:00Z or 2023-10-01T12:00:00.123456Z
            "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z$",
        },
        "finishedAt": {
            "type": "string",
            "format": "date-time",
            # Accepts only UTC timestamps in ISO 8601 format
            # Example: 2023-10-01T12:00:00Z or 2023-10-01T12:00:00.123456Z
            "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z$",
        },
        "languageId": {
            "type": "string",
        },
        "lettersLearned": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "string",
            },
        },
    },
    "required": [
        "correctAnswersVersions",
        "startedAt",
        "finishedAt",
        "languageId",
        "lettersLearned",
    ],
    "additionalProperties": False,
}
