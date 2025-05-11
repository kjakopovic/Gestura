import { ScrollView, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import CustomAppBar from "@/components/CustomAppBar";
import SettingSection, {
  SettingItemConfig,
} from "@/components/settings/SettingSection";
import CustomButton from "@/components/CustomButton";
import { logout } from "@/lib/auth";
import { useUserStore } from "@/store/useUserStore";
import { navigateToSetting } from "@/utils/navigationUtils";

// Create setting config factories to clean up the component
const createAppSettingsConfig = (): SettingItemConfig[] => [
  {
    title: "PREFERENCES",
    type: "button",
    onPress: () => navigateToSetting("app", "Preferences"),
  },
  {
    title: "NOTIFICATIONS",
    type: "button",
    onPress: () => navigateToSetting("app", "Notifications"),
  },
];

const createUserSettingsConfig = (): SettingItemConfig[] => [
  {
    title: "LANGUAGE SELECT",
    type: "button",
    onPress: () => navigateToSetting("user", "LanguageSelect"),
  },
  {
    title: "PERSONAL INFO",
    type: "button",
    onPress: () => navigateToSetting("user", "PersonalInfo"),
  },
  {
    title: "SUBSCRIPTION",
    type: "button",
    onPress: () => navigateToSetting("user", "Subscription"),
  },
  {
    title: "CUSTOMER SUPPORT",
    type: "button",
    onPress: () => navigateToSetting("user", "CustomerSupport"),
  },
];

const Settings = () => {
  const router = useRouter();
  const clearUserData = useUserStore((state) => state.clearUserData);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    clearUserData();
    router.replace("/(auth)");
  };

  const APP_SETTINGS = createAppSettingsConfig();
  const USER_SETTINGS = createUserSettingsConfig();

  return (
    <>
      <CustomAppBar title="SETTINGS" backButton />
      <View className="bg-grayscale-800 h-full pt-36 px-10 gap-2">
        <View className="flex flex-col gap-y-7">
          <SettingSection title="APP SETTINGS" items={APP_SETTINGS} />
          <SettingSection title="USER SETTINGS" items={USER_SETTINGS} />
        </View>
        <View>
          <CustomButton
            onPress={handleLogout}
            text="LOG OUT"
            style="error"
            noMargin
          />
        </View>
      </View>
    </>
  );
};

export default Settings;
