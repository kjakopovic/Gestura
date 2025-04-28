import { ScrollView } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomAppBar from "@/components/CustomAppBar";
import SettingSection, {
  SettingItemConfig,
} from "@/components/settings/SettingSection";

const Preferences = () => {
  const [preferences, setPreferences] = useState({
    soundEffects: true,
    hapticFeedback: true,
  });

  const PREFERENCES: SettingItemConfig[] = [
    {
      title: "Sound Effects",
      type: "toggle",
      value: preferences.soundEffects,
      onChange: (value) => {
        setPreferences((prev) => ({
          ...prev,
          soundEffects: value,
        }));
      },
    },
    {
      title: "Haptic Feedback",
      type: "toggle",
      value: preferences.hapticFeedback,
      onChange: (value) => {
        setPreferences((prev) => ({
          ...prev,
          hapticFeedback: value,
        }));
      },
    },
  ];

  return (
    <>
      <CustomAppBar title="PREFERENCES" backButton />
      <ScrollView className="bg-grayscale-800 mt-24 px-10">
        <SafeAreaView className="bg-grayscale-800 flex-1">
          <SettingSection title="PREFERENCES" items={PREFERENCES} noTitle />
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default Preferences;
