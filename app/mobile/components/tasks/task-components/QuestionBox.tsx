import { View, Text } from "react-native";
import React from "react";

type QuestionBoxProps = {
  text?: string;
};

const QuestionBox = ({ text }: QuestionBoxProps) => {
  return (
    <View>
      <Text className="m-8 w-96 h-100% rounded-xl border border-grayscale-400 items-center justify-center text-grayscale-100 font-inter text-xl p-6 text-center">
        {text}
      </Text>
    </View>
  );
};

export default QuestionBox;
