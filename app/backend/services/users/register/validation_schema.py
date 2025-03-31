schema = {
    "type": "object",
    "properties": {
        "email": {
            "type": "string",
            "format": "email"
        },
        "username": {
            "type": "string",
            "minLength": 1,
            "maxLength": 20,
        },
        "password": {
            "type": "string",
            "minLength": 7
        }
    },
    "required": ["email", "username", "password"],
    "additionalProperties": False
}