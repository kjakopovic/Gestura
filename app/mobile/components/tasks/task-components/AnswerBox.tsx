import { Text, Image, TouchableOpacity } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";

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
    : icons.error_testing;

  return (
    <TouchableOpacity
      className={`flex-row w-[40%] h-40 rounded-xl border border-grayscale-400 items-center justify-center my-4 pt-4 ${
        isSelected ? "bg-grayscale-500" : "bg-grayscale-800"
      }`}
      onPress={handlePress}
    >
      {/* <Text className="text-white text-8xl font-interExtraBold">{text}</Text> */}
      {image ? (
        <Image source={imageSource} className="size-32" />
      ) : (
        <Text className="text-white text-8xl font-interExtraBold">{text}</Text>
      )}
    </TouchableOpacity>
  );
};

export default AnswerBox;
