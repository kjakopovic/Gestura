import { View, Text, Modal, Image, TouchableOpacity } from "react-native";
import React, { useState } from "react";

import CustomButton from "@/components/CustomButton";
import BackButton from "../BackButton";
import PurchaseResult from "./PurchaseResult";
import * as icons from "@/constants/icons";

type PurchaseModalProps = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  item: { type: string; price: number };
  price: number;
  userCoins: number;
  onPurchase?: (success: boolean) => void;
};

const PurchaseModal = ({
  visible,
  setVisible,
  item,
  price,
  userCoins,
  onPurchase,
}: PurchaseModalProps) => {
  const [showResult, setShowResult] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(false);

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "hearts":
        return icons.heart;
      case "xp":
        return icons.experience_token;
      case "coins":
        return icons.coin;
      case "chest":
        return icons.chest;
      case "bag":
        return icons.bag_coins;
      default:
        return icons.error_testing;
    }
  };

  const canAfford = userCoins >= price;

  const handlePurchase = () => {
    const success = canAfford;
    setPurchaseResult(success);
    setShowResult(true);

    if (onPurchase) {
      onPurchase(success);
    }
  };

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      {showResult && (
        <PurchaseResult
          visible={showResult}
          setVisible={(val) => {
            setShowResult(val);
            if (!val) setVisible(false);
          }}
          item={item.type}
          success={purchaseResult}
        />
      )}
      <View className="w-full h-1/6 flex flex-row justify-start items-center bg-grayscale-800">
        <TouchableOpacity onPress={handleClose}>
          <Text className="text-grayscale-400 text-4xl ml-6">X</Text>
        </TouchableOpacity>
      </View>
      <View className="w-full h-5/6 flex flex-col justify-center items-center bg-grayscale-800">
        <View className="w-full h-2/5 flex flex-col items-center justify-center">
          <View className="w-52 h-52 flex flex-row items-center justify-center bg-grayscale-700 rounded-xl border-2 border-grayscale-400 border-b-4 m-6">
            <Image
              source={getIcon(item.type)}
              className="size-40"
              resizeMode="contain"
            />
          </View>
          <Text className="text-grayscale-100 text-4xl font-inter w-3/4 text-center m-6">
            Do you want to buy{" "}
            <Text className="font-interBold">{item.type}</Text>?
          </Text>
          <View className="flex flex-row items-center justify-center m-6 mb-24">
            <Image source={icons.coin} className="w-8 h-8" />
            <Text className="text-primary text-4xl font-interExtraBold px-2">
              {price}
            </Text>
          </View>
        </View>
        <CustomButton text="CONTINUE" style="base" onPress={handlePurchase} />
      </View>
    </Modal>
  );
};

export default PurchaseModal;
