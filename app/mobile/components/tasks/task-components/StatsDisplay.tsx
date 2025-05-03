import React from "react";
import { View, Text, Image } from "react-native";
import * as icons from "@/constants/icons";
import { LevelCompletionStats } from "@/hooks/useLevelTasks";

export const StatsDisplay = ({ stats }: { stats: LevelCompletionStats }) => (
  <>
    <View className="flex-row justify-between m-10 items-center w-80 h-20 border border-grayscale-400 rounded-xl">
      <View className="flex-row justify-center items-center w-20 h-10 border border-grayscale-400 rounded-xl mx-2">
        <Text className="text-blue-600 p-1 font-interBold text-xl">
          {stats.xpEarned}
        </Text>
        <Image className="p-1" source={icons.experience_token} />
      </View>
      <View className="flex-row justify-center items-center w-20 h-10 border border-grayscale-400 rounded-xl mx-2">
        <Text className="text-success p-1 font-interBold text-xl">
          {stats.percentageCorrect}%
        </Text>
      </View>
      <View className="flex-row justify-center items-center w-20 h-10 border border-grayscale-400 rounded-xl mx-2">
        <Text className="text-yellow-400 p-1 font-interBold text-xl">
          {stats.coinsEarned}
        </Text>
        <Image source={icons.coin} />
      </View>
    </View>
    <Text className="text-grayscale-300 text-lg font-inter mb-5">
      {stats.correctTasks} of {stats.totalTasks} tasks completed correctly
    </Text>
  </>
);
