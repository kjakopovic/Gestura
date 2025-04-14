schema = {
    "type": "object",
    "properties": {
        "section": {
            "type": "number"
        },
        "sectionName": {
            "type": "string"
        },
        "version": {
            "type": "number"
        },
        "question": {
            "type": "string"
        },
        "possibleAnswers": {
            "type": "list"
        },
        "correctAnswerIndex": {
            "type": "number"
        }
    },
    "required": ["section", "sectionName", "version",
                 "question", "possibleAnswers", "correctAnswerIndex"],
    "additionalProperties": False
}