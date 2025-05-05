import React from "react";
import { Stack } from "expo-router";

const PostLoginLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(profile-options)" options={{ headerShown: false }} />
      <Stack.Screen name="level" options={{ headerShown: false }} />
      <Stack.Screen
        name="(inventory-options)"
        options={{ headerShown: false }}
      />
    </Stack>
  );
};

export default PostLoginLayout;
