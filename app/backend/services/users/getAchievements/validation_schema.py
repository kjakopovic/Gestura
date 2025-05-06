schema = {
    "type": "object",
    "properties": {
        "query_page_size":{
            "type": "string",
            "pattern": "^[1-9][0-9]*$"
        }
    },
    "required": ["query_page_size"],
    "additionalProperties": False
}