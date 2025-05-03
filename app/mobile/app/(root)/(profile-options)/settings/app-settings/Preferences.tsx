import { ScrollView, View, Text, Alert } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomAppBar from "@/components/CustomAppBar";
import SettingSection from "@/components/settings/SettingSection";
import { useUserStore } from "@/store/useUserStore";
import CustomButton from "@/components/CustomButton";
import { useSettingsState } from "@/hooks/useSettingsState";
import { createPreferenceItems } from "@/utils/preferences";

const Preferences = () => {
  const userData = useUserStore((state) => state.user);
  const updateUserPreference = useUserStore(
    (state) => state.updateUserPreference
  );

  const initialPreferences = {
    soundEffects: userData?.sound_effects ?? false,
    hapticFeedback: userData?.haptic_feedback ?? false,
  };

  const {
    state: preferences,
    setState: setPreferences,
    hasChanges,
    saveChanges,
    isLoading,
    error,
  } = useSettingsState(initialPreferences);

  const handleChange = (key: string, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveChanges = async () => {
    // Still update local state through the store
    updateUserPreference("sound_effects", preferences.soundEffects);
    updateUserPreference("haptic_feedback", preferences.hapticFeedback);

    const success = await saveChanges();

    if (success) {
      Alert.alert("Success", "Your preferences have been updated successfully");
    }
  };

  const PREFERENCES = createPreferenceItems(preferences, handleChange);

  return (
    <>
      <CustomAppBar title="PREFERENCES" backButton />
      <ScrollView className="bg-grayscale-800 mt-24 px-10">
        <SafeAreaView className="bg-grayscale-800 flex-1">
          <SettingSection title="PREFERENCES" items={PREFERENCES} noTitle />

          {error && (
            <View className="mb-4 px-2 py-3 bg-red-500/20 rounded-md">
              <Text className="text-red-500 font-medium">{error}</Text>
            </View>
          )}

          {hasChanges && (
            <View className="mb-10">
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

export default Preferences;
