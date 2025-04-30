import { View, Text, Image } from "react-native";
import React from "react";

import ShopOption from "./ShopOption";
import * as characters from "@/constants/characters";

const ChestOption = () => {
  const text = "Get clothing for your Character!";

  return (
    <View className="bg-grayscale-700 w-5/6 h-44 flex flex-row items-start justify-center border border-grayscale-400 border-b-2 rounded-xl">
      <ShopOption type="chest" price={100} borderless={true} />
      <View className="flex flex-col w-1/2 h-full items-center justify-center m-1">
        <Text className="text-primary text-l font-interBold text-center">
          {text}
        </Text>
        <Image source={characters.shopCharacter} className="m-2" />
      </View>
    </View>
  );
};

export default ChestOption;
