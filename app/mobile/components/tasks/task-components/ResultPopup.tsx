import {
  View,
  Text,
  Modal,
  AppState,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { router } from "expo-router";

import CustomButton from "@/components/CustomButton";

type PopupProps = {
  visible: boolean;
  isSuccess: boolean;
  correctAnswer?: string;
  correctImage?: ImageSourcePropType;
  onDismiss?: () => void;
  buttonStyle?: "base" | "success" | "error" | "fail";
  taskVersion?: number;
};

const ResultPopup = ({
  visible,
  isSuccess,
  onDismiss,
  correctAnswer,
  correctImage,
  buttonStyle,
  taskVersion,
}: PopupProps) => {
  // Simple internal verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const popupButtonStyle = buttonStyle || (isSuccess ? "success" : "error");

  // When popup becomes visible for task version 3, show a brief verification animation
  useEffect(() => {
    if (visible && taskVersion === 3) {
      setIsVerifying(true);

      // Show verification for 1.5 seconds then display result
      const timer = setTimeout(() => {
        setIsVerifying(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [visible, taskVersion]);

  // Reset verification state when popup is dismissed
  useEffect(() => {
    if (!visible) {
      setIsVerifying(false);
    }
  }, [visible]);

  // Text that changes based on state
  const popupText = isVerifying
    ? "Analyzing your gesture..."
    : isSuccess
    ? "Good job!\nThe answer was indeed:"
    : "So close!\nThe answer was:";

  const closePopup = () => {
    if (onDismiss) {
      onDismiss();
    }
    router.push("/(root)/(tabs)/Home");
  };

  // AppState listener
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        visible &&
        (nextAppState === "inactive" || nextAppState === "background")
      ) {
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
              isVerifying
                ? "text-grayscale-100 text-2xl font-interExtraBold mb-4"
                : isSuccess
                ? "text-success text-2xl font-interExtraBold mb-4"
                : "text-error text-2xl font-interExtraBold mb-4"
            }`}
          >
            {popupText}
          </Text>

          {isVerifying ? (
            <View className="flex items-center justify-center border border-grayscale-400 rounded-xl w-40 h-40">
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : (
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
          )}

          {isVerifying ? (
            <View className="w-3/4 self-center mt-16 py-4 border border-grayscale-400 bg-grayscale-700 rounded-2xl flex-row justify-center items-center">
              <Text className="text-grayscale-100 text-lg font-interExtraBold">
                PLEASE WAIT...
              </Text>
            </View>
          ) : (
            <CustomButton
              onPress={closePopup}
              text="CONTINUE"
              style={popupButtonStyle}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ResultPopup;
