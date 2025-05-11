import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";

import ChestOpening from "./ChestOpening";

type ItemProps = {
  itemId: string; // Add itemId
  itemTitle: string;
  icon: string;
  category?: string;
  onPress: (
    itemId: string,
    itemCategory?: string
  ) => Promise<number | undefined>; // This is activateItem
  fetchInventory: () => Promise<void>; // To refresh inventory after chest modal closes
};

const Item = ({
  itemId,
  itemTitle,
  icon,
  category,
  onPress,
  fetchInventory,
}: ItemProps) => {
  const [showChestModal, setShowChestModal] = useState(false);
  const [isOpeningChest, setIsOpeningChest] = useState(false);
  const [chestPrizeCoins, setChestPrizeCoins] = useState<number | null>(null);

  const handleOpenChestPress = async () => {
    if (isOpeningChest) return;

    setIsOpeningChest(true);
    setChestPrizeCoins(null); // Reset before API call
    try {
      const coinsWon = await onPress(itemId, category); // This is activateItem

      if (typeof coinsWon === "number") {
        setChestPrizeCoins(coinsWon);
        setShowChestModal(true); // This should trigger the modal
      } else {
        // If activateItem handled an error alert, that's fine.
        // If it was a silent failure to get coins, this log helps.
      }
    } catch (error) {
      console.error(
        `Item.tsx (${itemTitle}): Error in handleOpenChestPress after calling onPress:`,
        error
      );
    } finally {
      setIsOpeningChest(false);
    }
  };

  const buttonText =
    category === "chest"
      ? isOpeningChest
        ? "OPENING..."
        : "OPEN"
      : "ACTIVATE";

  return (
    <View className="bg-grayscale-700 w-full flex flex-row justify-between items-center border border-grayscale-400 rounded-xl p-4 my-4">
      <Image source={{ uri: icon }} className="size-12" />

      <View className="flex flex-col justify-center items-center w-5/6">
        <Text className="text-xl text-grayscale-100 font-interBold mb-1">
          {itemTitle}
        </Text>
        <TouchableOpacity
          className="w-3/4 border border-grayscale-300 rounded-xl py-1 flex-row justify-center items-center"
          onPress={() => {
            if (category === "chest") {
              handleOpenChestPress();
            } else {
              onPress(itemId, category); // For non-chest items, call activateItem directly
            }
          }}
          disabled={isOpeningChest && category === "chest"}
        >
          {isOpeningChest && category === "chest" && (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
          )}
          <Text className="text-xl text-grayscale-300 font-interBold text-center">
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>

      {showChestModal && category === "chest" && chestPrizeCoins !== null && (
        <ChestOpening
          onClose={() => {
            setShowChestModal(false);
            setChestPrizeCoins(null);
            fetchInventory();
          }}
          prizeCoins={chestPrizeCoins}
        />
      )}
    </View>
  );
};

export default Item;
