schema = {
    "type": "object",
    "properties": {
        "battlepass_level":{
            "type": "string",
            "pattern": "^[1-9][0-9]*$"
        }
    },
    "required": ["battlepass_level"],
    "additionalProperties": False
}