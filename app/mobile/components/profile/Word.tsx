import { View, Text, Image } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";

type WordProps = {
  word: string;
  noBorder?: boolean;
};

const Word = ({ word, noBorder }: WordProps) => {
  return (
    <View
      className={`w-full flex-row items-center justify-between px-4 py-2 border-grayscale-400 ${
        noBorder ? noBorder : "border-b"
      }`}
    >
      <Text className="text-grayscale-100 text-lg font-interBold m-2">
        {word}
      </Text>
      <Image className="m-2" source={icons.more} />
    </View>
  );
};

export default Word;
