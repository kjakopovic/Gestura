import React from "react";
import { Stack } from "expo-router";

export default function PremiumOptionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UpgradeToPremium" />
      <Stack.Screen name="CommChoice" />
      <Stack.Screen name="Signer" />
      <Stack.Screen name="Talker" />
    </Stack>
  );
}
