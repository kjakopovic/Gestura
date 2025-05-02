import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";

type ItemProps = {
  itemTitle: string;
  iconName: string;
};

const Item = ({ itemTitle, iconName }: ItemProps) => {
  const icon = icons[iconName as keyof typeof icons] || icons.error_testing;

  return (
    <View className="bg-grayscale-700 w-5/6 flex flex-row justify-between items-center border border-grayscale-400 rounded-xl py-4 px-4 m-4">
      <View className="w-1/6">
        <Image source={icon} className="size-12" />
      </View>

      <View className="flex flex-col justify-center items-center w-5/6">
        <Text className="text-xl text-grayscale-100 font-interBold mb-1">
          {itemTitle}
        </Text>
        <TouchableOpacity
          className="w-3/4 border border-gestBlue rounded-xl"
          onPress={() => {
            alert("Activated item!");
          }}
        >
          <Text className="text-xl text-gestBlue font-interBold text-center mt-1 pb-1">
            ACTIVATE
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Item;
