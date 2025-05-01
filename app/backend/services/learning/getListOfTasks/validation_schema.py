schema = {
    "type": "object",
    "properties": {
        "level": {"type": "string", "pattern": "^[1-9][0-9]*$"},
        "language": {"type": "string"},
    },
    "required": ["level", "language"],
    "additionalProperties": False,
}
