import {
  Modal,
  View,
  Text,
  Image,
  BackHandler,
  InteractionManager,
} from "react-native";
import React, { useEffect } from "react";
import CustomButton from "../CustomButton";

import * as icons from "@/constants/icons";

type PurchaseResultProps = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  item: string;
  success: boolean;
  message?: string; // Add message prop
};

const PurchaseResult = ({
  visible,
  setVisible,
  item,
  success,
  message = "", // Default to empty string
}: PurchaseResultProps) => {
  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (visible) {
          handleContinue();
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [visible]);

  const handleContinue = () => {
    // Use InteractionManager to ensure UI thread isn't blocked
    InteractionManager.runAfterInteractions(() => {
      setVisible(false);
    });
  };

  return (
    <Modal
      animationType="none" // Try without animation to see if it helps
      transparent={true}
      visible={visible}
      onRequestClose={handleContinue}
    >
      <View className="w-full h-1/2 z-10"></View>
      <View className="w-full h-1/2 flex flex-col items-center justify-center bg-grayscale-800 border-t-2 border-grayscale-400 z-100">
        {success ? (
          <>
            <Text className="text-grayscale-100 text-4xl font-inter m-8">
              {message || `You've bought ${item}!`}
            </Text>
          </>
        ) : (
          <>
            <Text className="text-grayscale-100 text-4xl font-inter">
              {message || "Not enough coins!"}
            </Text>
            <Image
              source={icons.coin}
              className="size-10 mt-6"
              resizeMode="contain"
            />
          </>
        )}

        <CustomButton text="CONTINUE" style="base" onPress={handleContinue} />
      </View>
    </Modal>
  );
};

export default PurchaseResult;
