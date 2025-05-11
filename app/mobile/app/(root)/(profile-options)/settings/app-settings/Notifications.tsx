import { ScrollView, View, Text, Alert } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAppBar from "@/components/CustomAppBar";
import SettingSection from "@/components/settings/SettingSection";
import { useUserStore } from "@/store/useUserStore";
import CustomButton from "@/components/CustomButton";
import { useSettingsState } from "@/hooks/useSettingsState";
import { createNotificationItems } from "@/utils/notifications";

const Notifications = () => {
  const userData = useUserStore((state) => state.user);
  const updateUserPreference = useUserStore(
    (state) => state.updateUserPreference
  );

  const initialNotifications = {
    pushNotifications: userData?.push_notifications ?? true,
    heartRefill: userData?.heart_refill ?? true,
    dailyReminder: userData?.daily_reminder ?? true,
  };

  const {
    state: notifications,
    setState: setNotifications,
    hasChanges,
    saveChanges,
    isLoading,
    error,
  } = useSettingsState(initialNotifications);

  const handleChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveChanges = async () => {
    updateUserPreference("push_notifications", notifications.pushNotifications);
    updateUserPreference("heart_refill", notifications.heartRefill);
    updateUserPreference("daily_reminder", notifications.dailyReminder);

    const success = await saveChanges();

    if (success) {
      Alert.alert(
        "Success",
        "Your notification settings have been updated successfully"
      );
    }
  };

  const NOTIFICATIONS = createNotificationItems(notifications, handleChange);

  return (
    <>
      <CustomAppBar title="NOTIFICATIONS" backButton />
      <ScrollView className="bg-grayscale-800 mt-24 px-10">
        <SafeAreaView className="bg-grayscale-800 flex-1">
          <SettingSection title="NOTIFICATIONS" items={NOTIFICATIONS} noTitle />

          {error && (
            <View className="mb-4 px-2 py-3 bg-red-500/20 rounded-md">
              <Text className="text-red-500 font-medium">{error}</Text>
            </View>
          )}

          {hasChanges && (
            <View className="mb-10 mt-5">
              <CustomButton
                onPress={handleSaveChanges}
                text={isLoading ? "SAVING..." : "SAVE CHANGES"}
                style="success"
                noMargin
                disabled={isLoading}
              />
            </View>
          )}
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default Notifications;
