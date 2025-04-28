import React from "react";
import { Stack } from "expo-router";

const ProfileOptionsLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="Words" options={{ headerShown: false }} />
      <Stack.Screen name="Achievements" options={{ headerShown: false }} />
    </Stack>
  );
};

export default ProfileOptionsLayout;
