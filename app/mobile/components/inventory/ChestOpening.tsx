import {
  View,
  Text,
  Modal,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";

import CustomButton from "../CustomButton";
import ChestItem from "./ChestItem";

import * as icons from "@/constants/icons";

type ChestOpeningProps = {
  onClose: () => void;
  prizeCoins: number;
};

const ChestOpening = ({ onClose, prizeCoins }: ChestOpeningProps) => {
  // Updated with all coin values from your JSON data
  const visualSpinnerPrizeValues = [
    10, 200, 300, 400, 500, 750, 1000, 1500, 2500, 50000,
  ].sort((a, b) => a - b);

  const spinnerItems = [...Array(10)].flatMap(() =>
    visualSpinnerPrizeValues.map((value) => ({ value }))
  );

  const translateY = useRef(new Animated.Value(0)).current;
  const [spinComplete, setSpinComplete] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const ITEM_HEIGHT = 60;
  const SPINNER_VIEW_HEIGHT = 160;

  useEffect(() => {
    let targetItemVisualIndex = visualSpinnerPrizeValues.indexOf(prizeCoins);

    if (targetItemVisualIndex === -1) {
      console.warn(
        `ChestOpening.tsx: Prize value ${prizeCoins} not found in visualSpinnerPrizeValues. Consider adding it. Defaulting animation target.`
      );
      targetItemVisualIndex = 0;
    }

    const repetitionNumber = 5;
    const targetItemInFullSpinnerList =
      repetitionNumber * visualSpinnerPrizeValues.length +
      targetItemVisualIndex;
    const safeTargetItemInFullSpinnerList = Math.min(
      targetItemInFullSpinnerList,
      spinnerItems.length - 1
    );
    const desiredTranslateY =
      SPINNER_VIEW_HEIGHT / 2 -
      (safeTargetItemInFullSpinnerList * ITEM_HEIGHT + ITEM_HEIGHT / 2);

    Animated.timing(translateY, {
      toValue: desiredTranslateY,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSpinComplete(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prizeCoins]);

  const handleModalClose = () => {
    if (!spinComplete || isClosing) return;
    setIsClosing(true);
    onClose();
  };

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <View className="w-full h-full bg-grayscale-800/80 flex flex-col items-center justify-center p-4">
        <View className="w-full max-w-sm bg-grayscale-700 border border-grayscale-400 rounded-xl flex flex-col justify-between items-center">
          <View className="w-full flex flex-row justify-center items-center p-6 border-b border-grayscale-400">
            <Image source={icons.bp_chest} className="size-20" />
          </View>

          <View
            className="w-full items-center justify-center relative overflow-hidden my-6"
            style={{ height: SPINNER_VIEW_HEIGHT }}
          >
            <View
              style={{ top: SPINNER_VIEW_HEIGHT / 2 - 1, zIndex: 1 }}
              className="absolute w-full h-[2px] bg-primary"
            />
            <Animated.View
              className="absolute top-0 left-0 right-0"
              style={{
                transform: [{ translateY: translateY }],
              }}
            >
              {spinnerItems.map((item, index) => (
                <View
                  key={`${index}-${item.value}`}
                  className="w-full items-center justify-center"
                  style={{ height: ITEM_HEIGHT }}
                >
                  <ChestItem value={item.value} />
                </View>
              ))}
            </Animated.View>
          </View>

          <View className="items-center mb-4 px-4">
            {spinComplete && !isClosing && (
              <View className="bg-grayscale-600 py-2 px-4 rounded-lg">
                <Text className="text-xl text-primary font-interBold text-center">
                  You won {prizeCoins} coins!
                </Text>
              </View>
            )}
            {isClosing && (
              <View className="flex-row items-center justify-center bg-grayscale-600 py-2 px-4 rounded-lg">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-lg text-grayscale-100 font-interMedium ml-2">
                  Closing...
                </Text>
              </View>
            )}
          </View>

          <View className="w-full p-4 pt-0">
            <CustomButton
              text={
                isClosing
                  ? "CLOSING..."
                  : spinComplete
                  ? "AWESOME!"
                  : "SPINNING..."
              }
              style="base"
              onPress={spinComplete ? handleModalClose : () => {}}
              disabled={!spinComplete || isClosing}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ChestOpening;
