import { View, Text, Image, ImageSourcePropType } from "react-native";
import React from "react";

type BenefitProps = {
  icon: ImageSourcePropType;
  text?: string;
  primaryText?: string; // Optional primary-colored text portion
};

const Benefit = ({ icon, text, primaryText }: BenefitProps) => {
  return (
    <View className="flex flex-row justify-between items-center w-full px-4 py-2 m-0">
      {primaryText ? (
        <Text className="text-lg font-interBold">
          <Text className="text-primary">{primaryText}</Text>
          <Text className="text-white"> {text}</Text>
        </Text>
      ) : (
        <Text className="text-white text-lg font-interBold">{text}</Text>
      )}
      <Image source={icon} className="size-6 mr-12" />
    </View>
  );
};

export default Benefit;
