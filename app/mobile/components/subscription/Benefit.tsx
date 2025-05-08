import { View, Text, Image, ImageSourcePropType } from "react-native";
import React from "react";

type BenefitProps = {
  icon: ImageSourcePropType;
  text: string;
};

const Benefit = ({ icon, text }: BenefitProps) => {
  return (
    <View className="flex flex-row justify-between items-center w-full px-4 py-2 m-0">
      <Text className="text-white text-base font-inter">{text}</Text>
      <Image source={icon} className="size-6 mr-12" />
    </View>
  );
};

export default Benefit;
