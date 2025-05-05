import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";

type QuestProps = {
  title: string;
  progress: number;
  maxProgress: number;
  iconName: string;
};

const Quest = ({ title, progress, maxProgress, iconName }: QuestProps) => {
  const icon = icons[iconName as keyof typeof icons] || icons.error_testing;

  const isComplete = progress >= maxProgress;

  return (
    <TouchableOpacity
      className={`w-5/6 flex flex-row justify-between items-center border rounded-xl py-4 px-4 m-4 ${
        isComplete
          ? "bg-success/10 border-success"
          : "bg-grayscale-700 border-grayscale-400"
      }`}
      onPress={() => {
        if (isComplete) {
          alert("Claimed quest reward!");
        }
      }}
    >
      <View className="flex flex-col justify-center items-center w-3/4">
        <Text
          className={`text-xl font-interBold mt-1 ${
            isComplete ? "text-success" : "text-grayscale-100"
          }`}
        >
          {title}
        </Text>
        <Text
          className={`text-xl font-interBold mt-1 ${
            isComplete ? "text-success" : "text-grayscale-100"
          }`}
        >
          {progress} / {maxProgress}
        </Text>
      </View>
      <View>
        <Image source={icon} className="size-12 m-2" />
      </View>
    </TouchableOpacity>
  );
};

export default Quest;
