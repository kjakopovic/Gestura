import React from "react";
import { Stack } from "expo-router";

const UserSettingsLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="CustomerSupport" options={{ headerShown: false }} />
      <Stack.Screen name="LanguageSelect" options={{ headerShown: false }} />
      <Stack.Screen name="PersonalInfo" options={{ headerShown: false }} />
      <Stack.Screen name="Subscription" options={{ headerShown: false }} />
    </Stack>
  );
};

export default UserSettingsLayout;
