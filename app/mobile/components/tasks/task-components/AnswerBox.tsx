import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import React from "react";

type AnswerBoxProps = {
  onPress: (text: string) => void;
  text?: string;
  image?: ImageSourcePropType;
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
          <Image source={image} className="w-100% h-100%" />
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
