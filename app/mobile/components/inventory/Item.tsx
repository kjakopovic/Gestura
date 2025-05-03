import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { useState } from "react";

import ChestOpening from "./ChestOpening";

import * as icons from "@/constants/icons";

type ItemProps = {
  itemTitle: string;
  iconName: string;
  buttonText: string;
};

const Item = ({ itemTitle, iconName, buttonText }: ItemProps) => {
  const [showChestModal, setShowChestModal] = useState(false);
  const icon = icons[iconName as keyof typeof icons] || icons.error_testing;

  // const chest = itemTitle === "chest";
  const chest = buttonText === "OPEN";

  return (
    <View className="bg-grayscale-700 w-5/6 flex flex-row justify-between items-center border border-grayscale-400 rounded-xl p-4 m-4">
      <Image source={icon} className="size-12" />

      <View className="flex flex-col justify-center items-center w-5/6">
        <Text className="text-xl text-grayscale-100 font-interBold mb-1">
          {itemTitle}
        </Text>
        <TouchableOpacity
          className="w-3/4 border border-grayscale-300 rounded-xl"
          onPress={() => {
            if (chest) {
              setShowChestModal(true);
            } else {
              alert("Activated item!");
            }
          }}
        >
          <Text className="text-xl text-grayscale-300 font-interBold text-center mt-1 pb-1">
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>

      {showChestModal && (
        <ChestOpening
          onClose={() => {
            setShowChestModal(false);
          }}
        />
      )}
    </View>
  );
};

export default Item;
