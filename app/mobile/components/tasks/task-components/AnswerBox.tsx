import { View, Text, TouchableOpacity } from "react-native";
import React from "react";

type AnswerBoxProps = {
  onPress: (text: string) => void;
  text: string;
  style?: string;
  isSelected: boolean;
};

const AnswerBox = ({ onPress, text, style, isSelected }: AnswerBoxProps) => {
  const handlePress = () => {
    //setIsPressed(!isPressed);
    onPress(text);
  };

  return (
    <View>
      <TouchableOpacity
        className={`flex-row w-40 h-40 rounded-xl border border-grayscale-400 items-center justify-center m-4 pt-4 ${
          isSelected ? "bg-success" : "bg-grayscale-800"
        }`}
        onPress={handlePress}
      >
        <Text className="text-white text-8xl font-interExtraBold">{text}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AnswerBox;
