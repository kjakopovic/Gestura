import { View, Text, Image } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";

type AchievementProps = {
  title: string;
  description: string;
  icon: string;
  completed: boolean;
};

const Achievement = ({
  title,
  description,
  icon,
  completed,
}: AchievementProps) => {
  const imageSource = icon
    ? typeof icon === "string"
      ? { uri: icon }
      : icon
    : icons.error_testing;

  return (
    <View className="m-2 w-full flex-row items-center justify-start px-4 py-2">
      <Image
        source={imageSource}
        className={`size-12 ${completed ? "opacity-100" : "opacity-20"}`}
      />
      <View className="flex-1 flex-column items-start justify-center py-1 ml-5">
        <Text
          className={`text-2xl flex-wrap font-interBold my-2 ${
            completed ? "text-grayscale-100" : "text-grayscale-400"
          }`}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          className={`font-interLight text-xl flex-wrap ${
            completed ? "text-grayscale-100" : "text-grayscale-400"
          }`}
          numberOfLines={3}
        >
          {description}
        </Text>
      </View>
    </View>
  );
};

export default Achievement;
