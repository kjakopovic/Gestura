import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { useState } from "react";

import ChestOpening from "./ChestOpening";

type ItemProps = {
  itemTitle: string;
  icon: string;
  category?: string;
  onPress: () => Promise<void>; // Changed from () => void
  activating?: boolean;
};

const Item = ({
  itemTitle,
  icon,
  category,
  onPress, // This is activateItem from Inventory.tsx
  activating,
}: ItemProps) => {
  const [showChestModal, setShowChestModal] = useState(false);

  const buttonText =
    category === "chest"
      ? activating // This prop would need to be passed from Inventory if used for chest opening state
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
              // Do NOT call onPress() here directly if it hides the modal.
              // The ChestOpening modal will trigger the actual item activation.
            } else {
              onPress(); // For non-chest items, call activateItem directly
            }
          }}
        >
          <Text className="text-xl text-grayscale-300 font-interBold text-center mt-1 pb-1">
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>

      {showChestModal && category === "chest" && (
        <ChestOpening
          onClose={() => {
            setShowChestModal(false);
            // You might want to refresh inventory data after a chest is opened and closed
            // This could be done by calling a refresh function passed from Inventory,
            // or if activateItem (onConfirmOpen) refreshes, it might already be handled.
          }}
          onConfirmOpen={onPress} // Pass the activateItem function to the modal
        />
      )}
    </View>
  );
};

export default Item;
