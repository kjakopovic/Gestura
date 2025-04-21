import { ScrollView } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import BackButton from "@/components/BackButton";
import SettingSection from "@/components/settings/SettingSection";
import SettingSubtitle from "@/components/settings/SettingSubtitle";
import * as icons from "@/constants/icons";

const Settings = () => {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // State for select items
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");
  const [selectedTheme, setSelectedTheme] = useState<string>("system");

  return (
    <ScrollView className="bg-grayscale-800">
      <SafeAreaView className="bg-grayscale-800 flex-1">
        <BackButton />
        <SettingSubtitle title="Settings" />

        {/* Toggle settings */}
        <SettingSection
          title="Toggle Settings"
          items={[
            {
              type: "toggle",
              title: "Dark Mode",
              value: darkMode,
              onChange: setDarkMode,
            },
            {
              type: "toggle",
              title: "Notifications",
              value: notifications,
              onChange: setNotifications,
            },
          ]}
        />

        {/* Select settings */}
        <SettingSection
          title="Select Settings"
          items={[
            {
              type: "select",
              title: "English",
              image: icons.gb,
              selected: selectedLanguage === "english",
              onPress: () => setSelectedLanguage("english"),
            },
            {
              type: "select",
              title: "Language: Spanish",
              selected: selectedLanguage === "spanish",
              onPress: () => setSelectedLanguage("spanish"),
            },
            {
              type: "select",
              title: "Theme: System",
              selected: selectedTheme === "system",
              onPress: () => setSelectedTheme("system"),
            },
            {
              type: "select",
              title: "Theme: Light",
              selected: selectedTheme === "light",
              onPress: () => setSelectedTheme("light"),
            },
            {
              type: "select",
              title: "Theme: Dark",
              selected: selectedTheme === "dark",
              onPress: () => setSelectedTheme("dark"),
            },
          ]}
        />

        {/* Button settings with navigation */}
        <SettingSection
          title="Account"
          items={[
            {
              type: "button",
              title: "Account Settings",
              onPress: () => router.push("/Profile"),
            },
            {
              type: "button",
              title: "Privacy Policy",
              onPress: () => router.push("/Home"),
            },
          ]}
        />
      </SafeAreaView>
    </ScrollView>
  );
};

export default Settings;
