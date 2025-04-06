schema = {
    "type": "object",
    "properties": {
        "email": {
            "type": "string",
            "format": "email"
        },
        "password": {
            "type": "string",
            "minLength": 7
        },
        "code": {
            "type": "string",
            "minLength": 6,
            "maxLength": 6
        }
    },
    "required": ["email", "password", "code"],
    "additionalProperties": False
}