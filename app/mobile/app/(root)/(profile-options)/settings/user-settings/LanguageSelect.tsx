import React, { useEffect } from "react";
import { Alert, ScrollView, ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAppBar from "@/components/CustomAppBar";
import SettingSection, {
  SettingItemConfig,
} from "@/components/settings/SettingSection";
import { useUserStore } from "@/store/useUserStore";
import { useSettingsState } from "@/hooks/useSettingsState";

const LanguageSelect = () => {
  const languages = useUserStore((state) => state.languages);
  const userSelectedLanguage = useUserStore((state) => state.selectedLanguage);
  const user = useUserStore((state) => state.user);

  const getInitialLanguage = () => {
    if (user?.language_id) {
      return user.language_id;
    }
    if (userSelectedLanguage) {
      return userSelectedLanguage;
    }
    return languages[0]?.id || "";
  };

  const {
    state: { chosenLanguage },
    setState,
    isLoading,
    error,
    saveChanges,
  } = useSettingsState({
    chosenLanguage: getInitialLanguage(),
  });

  // Update chosen language when dependencies change
  useEffect(() => {
    if (!chosenLanguage && languages.length > 0) {
      setState((prev) => ({
        ...prev,
        chosenLanguage: getInitialLanguage(),
      }));
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languages, userSelectedLanguage, user, chosenLanguage, setState]);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert(
        "Update Failed",
        "There was a problem updating your language preference.",
        [{ text: "OK" }]
      );
    }
  }, [error]);

  const handleLanguageSelect = async (language_id: string) => {
    if (isLoading || chosenLanguage === language_id) return;

    // Update the state with the selected language ID
    setState((prev) => ({ ...prev, chosenLanguage: language_id }));

    // Save the changes with the new language ID directly
    const success = await saveChanges({ chosenLanguage: language_id });

    if (success) {
      Alert.alert(
        "Language Updated",
        "Your language has been updated successfully.",
        [{ text: "OK" }]
      );
    }
  };

  const languageOptions: SettingItemConfig[] = languages.map((language) => ({
    title: language.name,
    type: "select",
    image: { uri: language.image_url },
    selected: chosenLanguage === language.id,
    onPress: () => handleLanguageSelect(language.id),
    disabled: isLoading,
  }));

  return (
    <>
      <CustomAppBar title="LANGUAGE SELECT" backButton />
      <ScrollView className="bg-grayscale-800 mt-24 px-10">
        <SafeAreaView className="bg-grayscale-800 flex-1">
          {isLoading && (
            <View className="flex items-center justify-center py-4">
              <ActivityIndicator size="large" color="#6B7280" />
            </View>
          )}
          <SettingSection title="LANGUAGE" items={languageOptions} noTitle />
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default LanguageSelect;
