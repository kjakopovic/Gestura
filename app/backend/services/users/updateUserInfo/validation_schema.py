schema = {
  "type": "object",
  "properties": {
    "settings": {
      "preferences": {
        "type": "object",
        "properties": {
          "soundEffects": {"type": "boolean"},
          "hapticFeedback": {"type": "boolean"},
        },
        "additionalProperties": False
      },
      "notifications": {
        "type": "object",
        "properties": {
          "pushNotifications": {"type": "boolean"},
          "heartRefill": {"type": "boolean"},
          "dailyReminder": {"type": "boolean"},
          "subscription": {"type": "boolean"},
        },
        "additionalProperties": False
      },
      "languageSettings": {
        "type": "object",
        "properties": {
          "language": {"type": "string"},
        },
        "additionalProperties": False
      },
      "profile": {
        "type": "object",
        "properties": {
          "username": {"type": "string"},
          "email": {"type": "string", "format": "email"},
          "phone": {"type": "string", "pattern": "^[0-9\\+\\-\\s\\(\\)]+$"},
        },
        "additionalProperties": False
      }
    }
  },
  "additionalProperties": False
}