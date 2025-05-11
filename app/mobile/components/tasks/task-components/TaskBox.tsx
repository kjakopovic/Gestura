import { View, Image, Text } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";

type TaskBoxProps = {
  text?: string;
  image?: string;
};

const TaskBox = ({ text, image }: TaskBoxProps) => {
  const imageSource = image
    ? typeof image === "string"
      ? { uri: image }
      : image
    : icons.error_testing;

  return (
    <View className="w-40 h-40 justify-center items-center bg-grayscale-800 rounded-xl border border-grayscale-400 my-8 ml-8 mb-0 p-6">
      {text ? (
        <Text className="text-center text-8xl mt-5 ml-1 text-white font-interBold">
          {text}
        </Text>
      ) : (
        <Image source={imageSource} className="size-32" />
      )}
    </View>
  );
};

export default TaskBox;
