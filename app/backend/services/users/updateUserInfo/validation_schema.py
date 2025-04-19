schema = {
    "type": "object",
    "properties": {
        "sound_effects": {
            "type": "boolean"
        },
        "haptic_feedback": {
            "type": "boolean"
        },
        "push_notifications": {
            "type": "boolean"
        },
        "heart_refill": {
            "type": "boolean"
        },
        "daily_reminder": {
            "type": "boolean"
        },
        "subscription": {
            "type": "boolean"
        },
        "chosen_language": {
            "type": "string",
            "enum": ["en", "es", "fr", "de"]
        },
        "username": {
            "type": "string",
            "minLength": 1,
            "maxLength": 20
        },
        "phone_number": {
            "type": "string",
            "pattern": "^[0-9\\+\\-\\s\\(\\)]+$"
        },
    },
    "required": [],
    "additionalProperties": False
}