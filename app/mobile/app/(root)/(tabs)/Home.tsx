import React, { useRef } from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";
import Toast, { ErrorToast } from "react-native-toast-message";

import PlayerInfoBar from "@/components/PlayerInfoBar";
import LevelMap from "@/components/levels/LevelMap";
import { useLevel } from "@/hooks/useLevel";
import { useUserData } from "@/hooks/useUserData";
import { navigateToLevel } from "@/utils/navigationUtils";

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

// Extract scroll handler to a separate function
const useScrollHandler = (onScrollEnd: () => void) => {
  return {
    onScroll: ({ nativeEvent }: { nativeEvent: any }) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const paddingToBottom = 200;
      if (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom
      ) {
        onScrollEnd();
      }
    },
    scrollEventThrottle: 400,
  };
};

const Home = () => {
  const scrollViewRef = useRef<ScrollView>(null);

  // Use the extracted hooks
  const { levels, isLoadingMore, handleScrollToEnd, loadMoreLevels } =
    useLevel();
  const { isLoading, userStats, userData, heartsNextRefill } = useUserData();

  // Get the current language ID with fallback
  const languageId = userData?.language_id || "usa";

  // Get the current level for the selected language
  const currentLevel = userData?.current_level?.[languageId] || 1;

  // Use the scroll handler
  const scrollHandlerProps = useScrollHandler(handleScrollToEnd);

  // Handle level press
  const handleLevelPress = (levelId: number) => {
    navigateToLevel(levelId, languageId);
  };

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
