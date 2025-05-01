import { SettingItemConfig } from "@/components/settings/SettingSection";

export const createNotificationItems = (
  notifications: {
    pushNotifications: boolean;
    heartRefill: boolean;
    dailyReminder: boolean;
  },
  onChange: (key: string, value: boolean) => void
): SettingItemConfig[] => {
  return [
    {
      title: "Push Notifications",
      type: "toggle",
      value: notifications.pushNotifications,
      onChange: (value) => onChange("pushNotifications", value),
    },
    {
      title: "Heart Refill",
      type: "toggle",
      value: notifications.heartRefill,
      onChange: (value) => onChange("heartRefill", value),
    },
    {
      title: "Daily Reminder",
      type: "toggle",
      value: notifications.dailyReminder,
      onChange: (value) => onChange("dailyReminder", value),
    },
  ];
};
