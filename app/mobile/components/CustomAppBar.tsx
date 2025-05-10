import { View, Text } from "react-native";
import React from "react";
import BackButton from "./BackButton";

type CustomAppBarProps = {
  title: string;
  backButton?: boolean;
};

const CustomAppBar = ({ title, backButton }: CustomAppBarProps) => {
  return (
    <View className="bg-grayscale-700 h-28 flex flex-row items-end justify-start rounded-b-2xl p-4 absolute top-0 w-full z-50">
      {backButton && <BackButton absolute top={45} />}
      <Text className="text-white text-lg font-interExtraBold w-full text-center">
        {title}
      </Text>
    </View>
  );
};

export default CustomAppBar;
