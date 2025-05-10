import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";

import ShopOption from "./ShopOption";
import * as characters from "@/constants/characters";

type ChestOptionProps = {
  chestPrice: number;
  onPress?: () => void; // Optional onPress function
};

const ChestOption = ({ chestPrice, onPress }: ChestOptionProps) => {
  const text = "Get clothing for your Character!";

  return (
    <TouchableOpacity
      className="bg-grayscale-700 w-full h-44 flex flex-row items-start justify-center border border-grayscale-400 border-b-2 rounded-xl"
      onPress={onPress}
    >
      <ShopOption type="chest" price={chestPrice} borderless={true} />
      <View className="flex flex-col w-1/2 h-full items-center justify-center m-1">
        <Text className="text-primary text-lg font-interBold text-center">
          {text}
        </Text>
        <Image source={characters.shopCharacter} className="m-2" />
      </View>
    </TouchableOpacity>
  );
};

export default ChestOption;
