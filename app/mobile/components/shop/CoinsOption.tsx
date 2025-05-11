import { View, Text, Image } from "react-native";
import React from "react";

type CoinsOptionProps = {
  title: string;
  amount: string;
  price: number;
  image?: string;
};

const CoinsOption = ({ title, price, amount, image }: CoinsOptionProps) => {
  return (
    <View className="bg-grayscale-700 w-[40%] h-40 flex flex-col items-center justify-between p-2 border border-grayscale-400 border-b-2 rounded-xl">
      <Text className="text-grayscale-100 text-xl font-interBold text-center m-1">
        {title}
      </Text>
      <View className="flex flex-row items-center justify-center">
        <Image source={{ uri: image }} className="size-8" />
        <Text className="text-primary text-2xl font-interExtraBold m-1 mx-2">
          {amount}
        </Text>
      </View>
      <View className="bg-grayscale-800 w-3/4 h-8 rounded-xl border-b border-grayscale-100 flex flex-col items-center justify-center">
        <Text className="text-grayscale-100 text-xl font-interExtraBold">
          €{price}
        </Text>
      </View>
    </View>
  );
};

export default CoinsOption;
