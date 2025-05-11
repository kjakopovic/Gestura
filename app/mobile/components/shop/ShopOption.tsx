import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";

type ShopOptionProps = {
  title?: string;
  price: number;
  image?: string;
  borderless: boolean;
  onPress?: () => void; // Optional onPress function
};

const ShopOption = ({
  image,
  title,
  price,
  borderless,
  onPress,
}: ShopOptionProps) => {
  return (
    <TouchableOpacity
      className={`bg-grayscale-700 w-[40%] h-40 flex flex-col items-center justify-center  ${
        borderless ? "" : "border border-grayscale-400 border-b-2"
      } rounded-xl`}
      onPress={onPress}
    >
      {title && (
        <Text className="text-grayscale-100 text-2xl font-interBold">
          {title}
        </Text>
      )}
      <Image
        source={{ uri: image }}
        className="w-16 h-16 my-2"
        resizeMode="contain"
      />
      <View className="bg-grayscale-800 w-3/4 h-8 rounded-xl border-b border-grayscale-100 flex flex-row items-center justify-center">
        <Image
          source={icons.coin}
          className="w-1/6 h-auto mr-1"
          resizeMode="contain"
        />
        <Text className="text-primary text-xl font-interExtraBold">
          {price}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ShopOption;
