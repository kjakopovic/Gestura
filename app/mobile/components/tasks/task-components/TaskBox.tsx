import { View, Image, Text, ImageSourcePropType } from "react-native";
import React from "react";

import * as hands from "@/constants/hand-signs";

type TaskBoxProps = {
  text?: string;
  image?: ImageSourcePropType;
};

const TaskBox = ({ text, image }: TaskBoxProps) => {
  const taskImage = image || hands.error_testing; //default error image ako je image undefined

  return (
    <View className="w-40 h-40 justify-center items-center bg-grayscale-800 rounded-xl border border-grayscale-400 m-8 mb-0 p-6">
      {text ? (
        <Text className="text-center text-9xl text-white font-interBold">
          {text}
        </Text>
      ) : (
        <Image source={taskImage} className="w-100% h-100%" />
      )}
    </View>
  );
};

export default TaskBox;
