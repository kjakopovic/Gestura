schema = {
    "type": "object",
    "properties": {
        "email": {
            "type": "string",
            "format": "email"
        },
        "code": {
            "type": "string",
            "minLength": 6,
            "maxLength": 6
        }
    },
    "required": ["email", "code"],
    "additionalProperties": False
}