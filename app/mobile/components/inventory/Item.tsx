import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { useState } from "react";

import ChestOpening from "./ChestOpening";

type ItemProps = {
  itemTitle: string;
  icon: string;
  category?: string;
  onPress: () => void;
  activating?: boolean;
};

const Item = ({
  itemTitle,
  icon,
  category,
  onPress,
  activating,
}: ItemProps) => {
  const [showChestModal, setShowChestModal] = useState(false);

  const buttonText =
    category === "chest"
      ? activating
        ? "OPENING..."
        : "OPEN"
      : activating
      ? "ACTIVATING..."
      : "ACTIVATE";

  return (
    <View className="bg-grayscale-700 w-full flex flex-row justify-between items-center border border-grayscale-400 rounded-xl p-4 my-4">
      <Image source={{ uri: icon }} className="size-12" />

      <View className="flex flex-col justify-center items-center w-5/6">
        <Text className="text-xl text-grayscale-100 font-interBold mb-1">
          {itemTitle}
        </Text>
        <TouchableOpacity
          className="w-3/4 border border-grayscale-300 rounded-xl"
          onPress={() => {
            if (category === "chest") {
              setShowChestModal(true);
              onPress();
            } else {
              onPress();
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
