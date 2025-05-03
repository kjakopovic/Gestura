import { SettingItemConfig } from "@/components/settings/SettingSection";

export const createPreferenceItems = (
  preferences: { soundEffects: boolean; hapticFeedback: boolean },
  onChange: (key: string, value: boolean) => void
): SettingItemConfig[] => {
  return [
    {
      title: "Sound Effects",
      type: "toggle",
      value: preferences.soundEffects,
      onChange: (value) => onChange("soundEffects", value),
    },
    {
      title: "Haptic Feedback",
      type: "toggle",
      value: preferences.hapticFeedback,
      onChange: (value) => onChange("hapticFeedback", value),
    },
  ];
};
