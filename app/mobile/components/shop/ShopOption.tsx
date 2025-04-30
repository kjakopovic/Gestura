import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import React from "react";

import * as icons from "@/constants/icons";

type ItemType = "hearts" | "coins" | "xp" | "chest";

type ShopOptionProps = {
  type: ItemType;
  price: number;
  borderless: boolean;
  onPress?: () => void; // Optional onPress function
};

const ShopOption = ({ type, price, borderless, onPress }: ShopOptionProps) => {
  let icon: ImageSourcePropType;
  let title: string;

  switch (type) {
    case "hearts":
      icon = icons.heart;
      title = "Hearts";
      break;
    case "coins":
      icon = icons.coin;
      title = "Coins";
      break;
    case "xp":
      icon = icons.experience_token;
      title = "Double XP";
      break;
    case "chest":
      icon = icons.chest;
      title = "Chest";
      break;
    default:
      icon = icons.error_testing; // Fallback to hearts if type is unknown
      title = "Hearts";
  }

  return (
    <TouchableOpacity
      className={`bg-grayscale-700 w-40 h-40 flex flex-col items-center justify-center  ${
        borderless ? "" : "border border-grayscale-400 border-b-2"
      } rounded-xl`}
      onPress={onPress}
    >
      <Text className="text-grayscale-100 text-2xl font-interBold">
        {title}
      </Text>
      <Image source={icon} className="w-16 h-16 my-2" resizeMode="contain" />
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
