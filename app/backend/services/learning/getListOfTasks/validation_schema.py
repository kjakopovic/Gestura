schema = {
    "type": "object",
    "properties": {"level": {"type": "string", "pattern": "^[1-9][0-9]*$"}},
    "required": ["level"],
    "additionalProperties": False,
}
