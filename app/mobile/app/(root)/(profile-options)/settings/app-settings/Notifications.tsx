import { ScrollView } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAppBar from "@/components/CustomAppBar";
import SettingSection, {
  SettingItemConfig,
} from "@/components/settings/SettingSection";

const Notifications = () => {
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    heartRefil: true,
    dailyReminder: true,
    subscription: true,
  });

  const NOTIFICATIONS: SettingItemConfig[] = [
    {
      title: "Push Notifications",
      type: "toggle",
      value: notifications.pushNotifications,
      onChange: (value) => {
        setNotifications((prev) => ({
          ...prev,
          pushNotifications: value,
        }));
      },
    },
    {
      title: "Heart Refill",
      type: "toggle",
      value: notifications.heartRefil,
      onChange: (value) => {
        setNotifications((prev) => ({
          ...prev,
          heartRefil: value,
        }));
      },
    },
    {
      title: "Daily Reminder",
      type: "toggle",
      value: notifications.dailyReminder,
      onChange: (value) => {
        setNotifications((prev) => ({
          ...prev,
          dailyReminder: value,
        }));
      },
    },
    {
      title: "Subscription",
      type: "toggle",
      value: notifications.subscription,
      onChange: (value) => {
        setNotifications((prev) => ({
          ...prev,
          subscription: value,
        }));
      },
    },
  ];

  return (
    <>
      <CustomAppBar title="NOTIFICATIONS" backButton />
      <ScrollView className="bg-grayscale-800 mt-24 px-10">
        <SafeAreaView className="bg-grayscale-800 flex-1">
          <SettingSection title="NOTIFICATIONS" items={NOTIFICATIONS} noTitle />
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default Notifications;
