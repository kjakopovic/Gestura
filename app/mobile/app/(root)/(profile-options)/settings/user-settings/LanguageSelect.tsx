import React, { useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAppBar from "@/components/CustomAppBar";
import SettingSection, {
  SettingItemConfig,
} from "@/components/settings/SettingSection";
import * as icons from "@/constants/icons";

const LanguageSelect = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("English (UK)");

  const handleLanguageSelect = (language: string) => {
    // Update the state with the selected language
    setSelectedLanguage(language);

    // Room for future API call implementation
    // Example: apiClient.updateUserLanguage(language);

    console.log(`Language selected: ${language}`);
  };

  const languageOptions: SettingItemConfig[] = [
    {
      title: "English (UK)",
      type: "select",
      image: icons.gb,
      selected: selectedLanguage === "English (UK)",
      onPress: () => handleLanguageSelect("English (UK)"),
    },
    {
      title: "German",
      type: "select",
      image: icons.germany,
      selected: selectedLanguage === "German",
      onPress: () => handleLanguageSelect("German"),
    },
  ];

  return (
    <>
      <CustomAppBar title="LANGUAGE SELECT" backButton />
      <ScrollView className="bg-grayscale-800 mt-24 px-10">
        <SafeAreaView className="bg-grayscale-800 flex-1">
          <SettingSection title="LANGUAGE" items={languageOptions} noTitle />
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default LanguageSelect;
