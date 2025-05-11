import { Text } from "react-native";
import React from "react";
import BackButton from "./BackButton";
import { SafeAreaView } from "react-native-safe-area-context";

type CustomAppBarProps = {
  title: string;
  backButton?: boolean;
};

const CustomAppBar = ({ title, backButton }: CustomAppBarProps) => {
  return (
    <SafeAreaView className="bg-grayscale-700 h-32 flex flex-row items-end justify-start rounded-b-2xl p-4 absolute top-0 w-full z-50">
      {backButton && <BackButton absolute top={55} />}
      <Text className="text-white text-lg font-interExtraBold w-full text-center">
        {title}
      </Text>
    </SafeAreaView>
  );
};

export default CustomAppBar;
