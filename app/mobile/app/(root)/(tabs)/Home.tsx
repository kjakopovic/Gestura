import React, { useCallback, useRef, useState } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Toast, { ErrorToast } from "react-native-toast-message";

import PlayerInfoBar from "@/components/PlayerInfoBar";
import LevelMap from "@/components/levels/LevelMap";
import { useLevel } from "@/hooks/useLevel";
import { useUserData } from "@/hooks/useUserData";
import { navigateToLevel } from "@/utils/navigationUtils";
import { useScrollHandler } from "@/hooks/useScrollHandler";

const toastConfig = {
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        backgroundColor: "#FF3B30", // Red background
        borderLeftColor: "#990000", // Darker red border
        marginBottom: 20, // Extra bottom margin
        width: "90%", // Slightly smaller width
      }}
      text1Style={{ fontSize: 16, fontWeight: "bold", color: "white" }}
      text2Style={{ fontSize: 14, color: "white" }}
    />
  ),
  // You can customize other toast types similarly
};

const Home = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Use the extracted hooks
  const {
    levels,
    isLoadingMore,
    handleScrollToEnd,
    loadMoreLevels,
    refreshLevels,
  } = useLevel();
  const { isLoading, userStats, userData, heartsNextRefill, refreshUserData } =
    useUserData();

  // Get the current language ID with fallback
  const languageId = userData?.language_id || "usa";

  // Get the current level for the selected language
  const currentLevel = userData?.current_level?.[languageId] || 1;

  // Use the scroll handler
  const scrollHandlerProps = useScrollHandler(handleScrollToEnd);

  // Handle level press
  const handleLevelPress = (levelId: number) => {
    if (userStats?.hearts <= 0) {
      Toast.show({
        type: "error",
        text1: "No hearts left",
        text2: "Please wait for your hearts to refill.",
        position: "bottom",
        bottomOffset: 100,
      });
      return;
    }
    navigateToLevel(levelId, languageId);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh user data and levels in parallel
    await Promise.all([refreshUserData(), refreshLevels()]);

    setRefreshing(false);
  }, [refreshUserData, refreshLevels]);

  // Show loading indicator when data is being fetched
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-grayscale-800">
        <ActivityIndicator
          size="large"
          color="#A162FF"
          className="absolute top-1/2"
          style={{ transform: [{ translateY: -50 }] }}
        />
      </View>
    );
  }

  return (
    <View className="bg-grayscale-800 flex-1">
      <PlayerInfoBar {...userStats} heartsNextRefill={heartsNextRefill} />
      <ScrollView
        ref={scrollViewRef}
        className="h-full w-full"
        contentContainerStyle={{
          paddingBottom: 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        {...scrollHandlerProps}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#A162FF"]}
            tintColor="#A162FF"
            title="Refreshing..."
            titleColor="#FFFFFF"
          />
        }
      >
        <View className="mt-20">
          <LevelMap
            levels={levels}
            onLevelPress={handleLevelPress}
            onLoadMore={loadMoreLevels}
            isLoadingMore={isLoadingMore}
            currentLevel={currentLevel}
          />
        </View>
      </ScrollView>
      <Toast config={toastConfig} />
    </View>
  );
};

export default Home;
