import { View, Text, Image } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";

type WordProps = {
  word: string;
};

const Word = ({ word }: WordProps) => {
  return (
    <View className="h-20 m-0 w-full flex-row items-center justify-between px-4">
      <Text className="text-grayscale-100 text-2xl font-interBold m-2">
        {word}
      </Text>
      <Image className="w-100% h-100% m-2" source={icons.more} />
    </View>
  );
};

export default Word;
