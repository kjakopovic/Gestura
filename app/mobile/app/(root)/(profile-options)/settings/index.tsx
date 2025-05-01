import { ScrollView, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import CustomAppBar from "@/components/CustomAppBar";
import SettingSection, {
  SettingItemConfig,
} from "@/components/settings/SettingSection";
import CustomButton from "@/components/CustomButton";

const Settings = () => {
  const router = useRouter();

  //hooks can't be used outside of components, hence why these consts stay here
  const APP_SETTINGS: SettingItemConfig[] = [
    {
      title: "PREFERENCES",
      type: "button",
      onPress: () => {
        router.push("/settings/app-settings/Preferences");
      },
    },
    {
      title: "NOTIFICATIONS",
      type: "button",
      onPress: () => {
        router.push("/settings/app-settings/Notifications");
      },
    },
  ];

  const USER_SETTINGS: SettingItemConfig[] = [
    {
      title: "LANGUAGE SELECT",
      type: "button",
      onPress: () => {
        router.push("/settings/user-settings/LanguageSelect");
      },
    },
    {
      title: "PERSONAL INFO",
      type: "button",
      onPress: () => {
        router.push("/settings/user-settings/PersonalInfo");
      },
    },
    {
      title: "SUBSCRIPTION",
      type: "button",
      onPress: () => {
        router.push("/settings/user-settings/Subscription");
      },
    },
    {
      title: "CUSTOMER SUPPORT",
      type: "button",
      onPress: () => {
        router.push("/settings/user-settings/CustomerSupport");
      },
    },
  ];

  return (
    <>
      <CustomAppBar title="SETTINGS" backButton />
      <ScrollView className="bg-grayscale-800 mt-24 px-10">
        <SafeAreaView className="bg-grayscale-800 flex-1">
          <View className="flex flex-col gap-y-7">
            <SettingSection title="APP SETTINGS" items={APP_SETTINGS} />
            <SettingSection title="USER SETTINGS" items={USER_SETTINGS} />
          </View>
          <View className="mt-10">
            <CustomButton
              onPress={() => {}}
              text="LOG OUT"
              style="error"
              noMargin
            />
          </View>
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default Settings;
