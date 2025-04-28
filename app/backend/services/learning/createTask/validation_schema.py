schema = {
    "type": "object",
    "properties": {
        "section": {
            "type": "number",
            "multipleOf": 10
        },
        "section_name": {
            "type": "string"
        },
        "version": {
            "type": "number",
            "enum": [1, 2, 3]
        },
        "question": {
            "type": "string"
        },
        "possible_answers": {
            "type": "array",
            "minItems": 4,
            "maxItems": 4,
        },
        "correct_answer_index": {
            "type": "number",
            "enum": [0, 1, 2, 3]
        }
    },
    "required": ["section", "section_name", "version",
                 "question", "possible_answers", "correct_answer_index"],
    "additionalProperties": False
}