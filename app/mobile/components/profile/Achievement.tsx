import { View, Text, Image, ImageSourcePropType } from "react-native";
import React from "react";

type AchievementProps = {
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
}: AchievementProps) => {
  return (
    <View className="m-2 w-full flex-row items-center justify-start px-4 py-2">
      <Image
        source={icon}
        className={`size-12 ${completed ? "opacity-100" : "opacity-20"}`}
      />
      <View className="flex-column items-start justify-center py-1 ml-5">
        <Text
          className={`text-2xl overflow-hidden font-interBold my-2 ${
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
