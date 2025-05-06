import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import React, { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer } from "@react-navigation/native";

import "./globals.css";
import { StatusBar } from "expo-status-bar";

import InterRegular from "@/assets/fonts/Inter_18pt-Regular.ttf";
import InterBold from "@/assets/fonts/Inter_18pt-Bold.ttf";
import InterSemiBold from "@/assets/fonts/Inter_18pt-SemiBold.ttf";
import InterMedium from "@/assets/fonts/Inter_18pt-Medium.ttf";
import InterLight from "@/assets/fonts/Inter_18pt-Light.ttf";
import InterThin from "@/assets/fonts/Inter_18pt-Thin.ttf";
import InterExtraLight from "@/assets/fonts/Inter_18pt-ExtraLight.ttf";
import InterExtraBold from "@/assets/fonts/Inter_18pt-ExtraBold.ttf";
import InterBlack from "@/assets/fonts/Inter_18pt-Black.ttf";

SplashScreen.preventAutoHideAsync().catch(console.warn);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: InterRegular,
    "Inter-Bold": InterBold,
    "Inter-SemiBold": InterSemiBold,
    "Inter-Medium": InterMedium,
    "Inter-Light": InterLight,
    "Inter-Thin": InterThin,
    "Inter-ExtraLight": InterExtraLight,
    "Inter-ExtraBold": InterExtraBold,
    "Inter-Black": InterBlack,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }

    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </NavigationContainer>
  );
}
