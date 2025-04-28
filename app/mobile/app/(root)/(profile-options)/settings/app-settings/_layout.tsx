import React from "react";
import { Stack } from "expo-router";

const AppSettingsLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="Notifications" options={{ headerShown: false }} />
      <Stack.Screen name="Preferences" options={{ headerShown: false }} />
    </Stack>
  );
};

export default AppSettingsLayout;
