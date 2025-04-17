schema = {
    "type": "object",
    "properties": {
        "section": {
            "type": "number",
            "multipleOf": 10
        },
        "sectionName": {
            "type": "string"
        },
        "version": {
            "type": "number",
            "enum": [1, 2, 3]
        },
        "question": {
            "type": "string"
        },
        "possibleAnswers": {
            "type": "array",
            "minItems": 4,
            "maxItems": 4,
        },
        "correctAnswerIndex": {
            "type": "number",
            "enum": [0, 1, 2, 3]
        }
    },
    "required": ["section", "sectionName", "version",
                 "question", "possibleAnswers", "correctAnswerIndex"],
    "additionalProperties": False
}