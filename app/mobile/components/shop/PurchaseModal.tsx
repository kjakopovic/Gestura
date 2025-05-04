import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  InteractionManager,
} from "react-native";
import React, { useState, useEffect } from "react";

import CustomButton from "@/components/CustomButton";
import PurchaseResult from "./PurchaseResult";
import * as icons from "@/constants/icons";

type PurchaseModalProps = {
  purchasing: boolean;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  item: any; // Updated to accept the Item type from Shop component
  price?: number; // Updated to be optional
  userCoins: number;
  message?: string; // Add message prop
  onPurchase: () => Promise<{ success: boolean }>; // Updated to return Promise with result
};

const PurchaseModal = ({
  purchasing,
  visible,
  setVisible,
  item,
  price = 0, // Provide default value
  userCoins,
  message = "", // Default to empty string
  onPurchase,
}: PurchaseModalProps) => {
  const [showResult, setShowResult] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Better cleanup with InteractionManager to ensure UI thread isn't blocked
  useEffect(() => {
    if (!visible) {
      // Use InteractionManager to run after animations complete
      InteractionManager.runAfterInteractions(() => {
        setShowResult(false);
        setPurchaseResult(false);
      });
    }
  }, [visible]);

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
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

  const itemType = item?.category || item?.type || "";
  const itemPrice = price || item?.price || 0;
  const canAfford = userCoins >= itemPrice;

  const handlePurchase = async () => {
    // Check if user can afford before processing
    if (!canAfford) {
      // Show failure immediately if can't afford
      setPurchaseResult(false);
      setShowResult(true);
      return;
    }

    // Set processing state
    setIsProcessing(true);

    try {
      // Wait for the API call to complete
      const result = await onPurchase();

      // Update the result state with the API response
      setPurchaseResult(result.success);

      // Only show result after API call completes
      InteractionManager.runAfterInteractions(() => {
        setShowResult(true);
      });
    } catch (error) {
      console.error("Error in purchase flow:", error);
      setPurchaseResult(false);
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Only close if result isn't showing
    if (!showResult) {
      setVisible(false);
    }
  };

  return (
    <Modal
      animationType="none" // Try without animation to see if it helps
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      {showResult && (
        <PurchaseResult
          visible={showResult}
          setVisible={(val) => {
            if (!val) {
              // First hide the result modal
              setShowResult(false);

              // Then close parent modal after a moment
              InteractionManager.runAfterInteractions(() => {
                setVisible(false);
              });
            } else {
              setShowResult(val);
            }
          }}
          item={itemType}
          success={purchaseResult}
          message={message} // Pass the message to PurchaseResult
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
              source={getIcon(itemType)}
              className="size-40"
              resizeMode="contain"
            />
          </View>
          <Text className="text-grayscale-100 text-4xl font-inter w-3/4 text-center m-6">
            Do you want to buy{" "}
            <Text className="font-interBold">{itemType}</Text>?
          </Text>
          <View className="flex flex-row items-center justify-center m-6 mb-24">
            <Image source={icons.coin} className="w-8 h-8" />
            <Text className="text-primary text-4xl font-interExtraBold px-2">
              {itemPrice}
            </Text>
          </View>
        </View>
        <CustomButton
          text={isProcessing || purchasing ? "PROCESSING..." : "PURCHASE"}
          style="base"
          onPress={handlePurchase}
          disabled={!canAfford || isProcessing || purchasing}
        />
      </View>
    </Modal>
  );
};

export default PurchaseModal;
