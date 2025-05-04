import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";

import * as hands from "@/constants/hand-signs";

type AnswerBoxProps = {
  onPress: (text: string) => void;
  text?: string;
  image?: string;
  answerValue: string;
  style?: string;
  isSelected: boolean;
};

const AnswerBox = ({
  onPress,
  text,
  image,
  answerValue,
  isSelected,
}: AnswerBoxProps) => {
  const handlePress = () => {
    //setIsPressed(!isPressed);
    onPress(answerValue);
  };

  const imageSource = image
    ? typeof image === "string"
      ? { uri: image }
      : image
    : hands.error_testing;

  return (
    <View>
      <TouchableOpacity
        className={`flex-row w-40 h-40 rounded-xl border border-grayscale-400 items-center justify-center m-4 pt-4 ${
          isSelected ? "bg-grayscale-500" : "bg-grayscale-800"
        }`}
        onPress={handlePress}
      >
        {/* <Text className="text-white text-8xl font-interExtraBold">{text}</Text> */}
        {image ? (
          <Image
            source={imageSource}
            className="size-32"
            resizeMode="contain"
          />
        ) : (
          <Text className="text-white text-8xl font-interExtraBold">
            {text}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default AnswerBox;
