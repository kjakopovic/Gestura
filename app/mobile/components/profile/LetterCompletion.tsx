import { View, Text } from "react-native";
import React from "react";

type LetterCompletionProps = {
  completedLetters?: string[];
  classname?: string;
};

const LetterCompletion = ({
  completedLetters = [],
  classname,
}: LetterCompletionProps) => {
  const alphabet = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  return (
    <View
      className={`p-2.5 rounded-2xl border border-grayscale-400 ${classname}`}
    >
      <View className="flex-row flex-wrap justify-center">
        {alphabet.map((letter) => (
          <Text
            key={letter}
            className={`text-2xl m-1.5 mx-2.5 ${
              completedLetters.includes(letter)
                ? "text-success font-interExtraBold"
                : "text-gray-500"
            }`}
          >
            {letter}
          </Text>
        ))}
      </View>
    </View>
  );
};

export default LetterCompletion;
