import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import React from "react";

import * as icons from "@/constants/icons";

type ItemType = "hearts" | "coins" | "xp" | "chest" | string;

type ShopOptionProps = {
  title?: string;
  type: ItemType;
  price: number;
  borderless: boolean;
  onPress?: () => void; // Optional onPress function
};

const ShopOption = ({
  title,
  type,
  price,
  borderless,
  onPress,
}: ShopOptionProps) => {
  let icon: ImageSourcePropType;

  switch (type) {
    case "hearts":
      icon = icons.heart;
      break;
    case "coins":
      icon = icons.coin;
      break;
    case "xp":
      icon = icons.experience_token;
      break;
    case "chest":
      icon = icons.chest;
      break;
    default:
      icon = icons.error_testing; // Fallback to error if type is unknown
  }

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
