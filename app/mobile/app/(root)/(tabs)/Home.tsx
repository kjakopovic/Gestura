import React, { useRef, useEffect, useState } from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";

import PlayerInfoBar from "@/components/PlayerInfoBar";
import LevelMap from "@/components/levels/LevelMap";
import { useLevel } from "@/hooks/useLevel";
import { useUserData } from "@/hooks/useUserData";
import { navigateToLevel } from "@/utils/navigationUtils";
import { useScrollHandler } from "@/utils/levelPathUtils";
import { LevelData } from "@/types/levels";

const Home = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const { isLoading, userStats } = useUserData();

  // Get the current level using language_id as the key
  const currentLanguageId = userStats?.language_id || "usa";
  const numericCurrentLevel =
    Number(userStats.current_level?.[currentLanguageId]) || 1;

  // Get levels with the useLevel hook
  const {
    levels: originalLevels,
    isLoadingMore,
    handleScrollToEnd,
    loadMoreLevels,
  } = useLevel(numericCurrentLevel);

  // Create a corrected version of the levels with accurate states
  const [correctedLevels, setCorrectedLevels] = useState<LevelData[]>([]);

  // Effect to update the corrected levels whenever the original levels change
  useEffect(() => {
    if (originalLevels && originalLevels.length > 0) {
      const updatedLevels = originalLevels.map((level) => {
        if (level.level < numericCurrentLevel) {
          return { ...level, state: "completed" as const };
        } else if (level.level === numericCurrentLevel) {
          return { ...level, state: "unlocked" as const };
        }
        return { ...level, state: "locked" as const };
      });

      setCorrectedLevels(updatedLevels);
    }
  }, [originalLevels, numericCurrentLevel]);

  // Use the scroll handler
  const scrollHandlerProps = useScrollHandler(handleScrollToEnd);

  // Handle level press
  const handleLevelPress = (levelId: number) => {
    navigateToLevel(levelId);
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

  // Safety check for levels
  if (!correctedLevels || correctedLevels.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-grayscale-800">
        <ActivityIndicator size="large" color="#A162FF" />
      </View>
    );
  }

  return (
    <View className="bg-grayscale-800 flex-1">
      <PlayerInfoBar {...userStats} />
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
            levels={correctedLevels}
            onLevelPress={handleLevelPress}
            onLoadMore={loadMoreLevels}
            isLoadingMore={isLoadingMore}
            currentLevel={numericCurrentLevel}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;
