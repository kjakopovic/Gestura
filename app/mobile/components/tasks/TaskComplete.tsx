import { View, Text, Image } from "react-native";
import React from "react";

import * as characters from "@/constants/characters";

import CustomButton from "../CustomButton";
import { LevelCompletionStats } from "@/hooks/useLevelTasks";
import { navigateToHome } from "@/utils/navigationUtils";
import { StatsDisplay } from "./task-components/StatsDisplay";

// Extract the Stats display into a separate component

interface TaskCompleteProps {
  stats: LevelCompletionStats;
  onContinue?: () => void;
}

const TaskComplete = ({ stats, onContinue }: TaskCompleteProps) => {
  // Handle continue button press
  const handleContinue = () => {
    console.log("TaskComplete continue button pressed");

    if (onContinue) {
      onContinue();
    } else {
      navigateToHome();
    }
  };

  return (
    <View className="flex-1 w-full h-full justify-center items-center mt-24">
      <Image className="w-40 h-40" source={characters.character1_cut} />
      <Text className="text-white text-4xl font-interBold">Nice one!</Text>
      <Text className="text-white text-2xl font-inter">
        You&apos;ve completed the level.
      </Text>

      <StatsDisplay stats={stats} />

      <View className="w-full items-center px-8">
        <CustomButton onPress={handleContinue} text="CONTINUE" style="base" />
      </View>
    </View>
  );
};

export default TaskComplete;
