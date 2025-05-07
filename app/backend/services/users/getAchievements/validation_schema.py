schema = {
    "type": "object",
    "properties": {
        "query_page_size":{
            "type": "string",
            "pattern": "^[1-9][0-9]*$"
        },
        "next_token": {
            "type": "string",
            "maxLength": 1000
        }
    },
    "required": ["query_page_size"],
    "additionalProperties": False
}