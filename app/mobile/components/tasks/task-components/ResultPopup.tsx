import {
  View,
  Text,
  Modal,
  AppState,
  Image,
  ImageSourcePropType,
} from "react-native";
import React, { useEffect } from "react";
import { router } from "expo-router";

import CustomButton from "@/components/CustomButton";

type PopupProps = {
  visible: boolean;
  isSuccess: boolean;
  correctAnswer?: string; //da se moze proslijediti correct answer
  correctImage?: ImageSourcePropType; //da se moze proslijediti correct image
  onDismiss?: () => void; //da kad se app refocusa da se popup ne otvori opet
  buttonStyle?: string;
};

const closePopup = () => {
  router.push("/(root)/(tabs)/Home");
};

const ResultPopup = ({
  visible,
  isSuccess,
  onDismiss,
  correctAnswer,
  correctImage,
}: PopupProps) => {
  const buttonStyle = isSuccess ? "success" : "error";
  const popupText = isSuccess
    ? "Good job!\nThe answer was indeed:"
    : "So close!\nThe answer was:";

  // AppState listener
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        visible &&
        (nextAppState === "inactive" || nextAppState === "background")
      ) {
        // zatvori popup kad je app unfocused na ostalim screenovima (bio se otvarao - bug)
        if (onDismiss) onDismiss();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [visible, onDismiss]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end items-center h-full w-full">
        <View className="flex-column w-full h-1/2 bg-grayscale-700 border-t border-grayscale-400 p-6 justify-center items-center">
          <Text
            className={`text-center ${
              isSuccess
                ? "text-success text-2xl font-interExtraBold mb-4"
                : "text-error text-2xl font-interExtraBold mb-4"
            }`}
          >
            {popupText}
          </Text>
          <View className="flex items-center justify-center border border-grayscale-400 rounded-xl w-40 h-40">
            {correctImage ? (
              <Image
                source={correctImage}
                className="w-100% h-100%"
                resizeMode="contain"
              />
            ) : (
              <Text className="text-white text-9xl font-interBold pt-6">
                {correctAnswer}
              </Text>
            )}
          </View>
          <CustomButton
            onPress={closePopup}
            text="CONTINUE"
            style={buttonStyle}
          />
        </View>
      </View>
    </Modal>
  );
};

export default ResultPopup;
