import { View, Text, Image } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";

type ChestItemProps = {
  value: number;
};

const ChestItem = ({ value }: ChestItemProps) => {
  return (
    <View className="w-full flex flex-row justify-center items-center border-b border-grayscale-400">
      <Image source={icons.coin} className="size-9 mt-6 mb-6 mr-1" />
      <Text className="text-4xl text-primary font-interExtraBold ml-1 pt-1">
        {value}
      </Text>
    </View>
  );
};

export default ChestItem;
