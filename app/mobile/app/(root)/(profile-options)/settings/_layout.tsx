import React from "react";
import { Stack } from "expo-router";

const SettingsLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="app-settings" options={{ headerShown: false }} />
      <Stack.Screen name="user-settings" options={{ headerShown: false }} />
    </Stack>
  );
};

export default SettingsLayout;
