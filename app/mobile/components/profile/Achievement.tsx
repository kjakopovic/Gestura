import { View, Text, Image, ImageSourcePropType } from "react-native";
import React from "react";

type achievementProps = {
  title: string;
  description: string;
  icon: ImageSourcePropType;
  completed: boolean;
};

const Achievement = ({
  title,
  description,
  icon,
  completed,
}: achievementProps) => {
  return (
    <View className="h-32 m-2 w-full flex-row items-center justify-between px-4">
      <Image source={icon} className="h-100% w-100%" />
      <View className="flex-column items-start justify-center w-3/4 h-3/4 py-1">
        <Text
          className={`text-2xl overflow-hidden w-3/4 font-interBold my-2 ${
            completed ? "text-grayscale-100" : "text-grayscale-400"
          }`}
        >
          {title}
        </Text>
        <Text
          className={`font-interLight text-xl ${
            completed ? "text-grayscale-100" : "text-grayscale-400"
          }`}
        >
          {description}
        </Text>
      </View>
    </View>
  );
};

export default Achievement;
