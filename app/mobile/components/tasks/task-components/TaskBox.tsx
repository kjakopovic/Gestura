import { View, Image, Text } from "react-native";
import React from "react";

import * as hands from "@/constants/hand-signs";

type TaskBoxProps = {
  text?: string;
  image?: string;
};

const TaskBox = ({ text, image }: TaskBoxProps) => {
  // Create proper image source - either from URL or fallback
  const imageSource = image
    ? typeof image === "string"
      ? { uri: image }
      : image
    : hands.error_testing;

  return (
    <View className="w-40 h-40 justify-center items-center bg-grayscale-800 rounded-xl border border-grayscale-400 m-8 mb-0">
      {text ? (
        <Text className="text-center text-8xl mt-5 text-white font-interBold">
          {text}
        </Text>
      ) : (
        <Image
          source={imageSource}
          className="w-full h-full"
          resizeMode="contain"
        />
      )}
    </View>
  );
};

export default TaskBox;
