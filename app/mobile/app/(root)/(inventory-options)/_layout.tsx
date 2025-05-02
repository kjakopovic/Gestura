import React from "react";
import { Stack } from "expo-router";

export default function InventoryOptionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BattlePass" />
      {/* Add other screens in this group if needed */}
    </Stack>
  );
}
