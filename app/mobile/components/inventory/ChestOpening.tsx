import {
  View,
  Text,
  Modal,
  Image,
  Animated,
  Dimensions,
  Easing,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";

import CustomButton from "../CustomButton";
import ChestItem from "./ChestItem";

import * as icons from "@/constants/icons";

type ChestOpeningProps = {
  onClose: () => void;
  onConfirmOpen: () => Promise<void>;
};

const ChestOpening = ({ onClose, onConfirmOpen }: ChestOpeningProps) => {
  const items = [
    { value: 20 },
    { value: 100 },
    { value: 20 },
    { value: 10 },
    { value: 50 },
    { value: 200 },
    { value: 30 },
    { value: 75 },
  ];

  const spinnerItems = [...Array(10)].flatMap(() => [...items]);

  const scrollY = useRef(new Animated.Value(0)).current;

  const [spinComplete, setSpinComplete] = useState(false);
  const [winningIndex, setWinningIndex] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);

  const ITEM_HEIGHT = 60;
  const { height } = Dimensions.get("window");

  useEffect(() => {
    const randomItemIndex =
      Math.floor(Math.random() * items.length) + spinnerItems.length / 2;
    setWinningIndex(randomItemIndex);

    const finalPosition =
      randomItemIndex * ITEM_HEIGHT - height / 2 + ITEM_HEIGHT / 2;

    scrollY.setValue(0);

    Animated.timing(scrollY, {
      toValue: finalPosition,
      duration: 5000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSpinComplete(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClaim = async () => {
    if (!spinComplete || isClaiming) return;

    setIsClaiming(true);
    try {
      await onConfirmOpen();
      onClose();
    } catch (error) {
      console.error("Error claiming chest reward:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Modal visible={true} transparent={true} animationType="slide">
      <View className="w-full h-full bg-grayscale-800 flex flex-col items-center justify-center">
        <View className="w-3/4 h-3/4 bg-grayscale-700 border border-grayscale-400 rounded-xl flex flex-col justify-bewtween items-center">
          <View className="w-full flex flex-row justify-center items-center p-8 border-b border-grayscale-400">
            <Image source={icons.bp_chest} className="size-20" />
          </View>
          <View className="w-full mt-24 items-center justify-center relative overflow-hidden border-t border-b border-grayscale-400">
            <View className="absolute z-99 bottom-44 w-full h-2 border-t-2 border-grayscale-400" />
            <View
              style={{
                transform: [{ rotate: "45deg" }],
              }}
              className="bg-grayscale-700 absolute z-100 bottom-44 w-4 h-4 border-2 border-grayscale-400"
            />
            <Animated.View
              className="w-full h-2/5 flex flex-col items-center justify-center "
              style={{
                transform: [
                  {
                    translateY: scrollY.interpolate({
                      inputRange: [0, spinnerItems.length * ITEM_HEIGHT],
                      outputRange: [0, -spinnerItems.length * ITEM_HEIGHT],
                    }),
                  },
                ],
              }}
            >
              {spinnerItems.map((item, index) => (
                <View
                  key={index}
                  className="w-full items-center justify-center mx-1"
                  style={{ height: ITEM_HEIGHT }}
                >
                  <ChestItem value={item.value} />
                </View>
              ))}
            </Animated.View>
          </View>

          {spinComplete && !isClaiming && (
            <View className="bg-grayscale-600 pt-4 rounded-xl mt-1">
              <Text className="text-xl text-primary font-interBold text-center">
                You won {spinnerItems[winningIndex]?.value} coins!
              </Text>
            </View>
          )}
          {isClaiming && (
            <View className="flex-row items-center justify-center bg-grayscale-600 py-2 rounded-xl mt-1">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-lg text-grayscale-100 font-interMedium ml-2">
                Claiming reward...
              </Text>
            </View>
          )}
          <CustomButton
            text={
              isClaiming
                ? "CLAIMING..."
                : spinComplete
                ? "CLAIM"
                : "SPINNING..."
            }
            style="base"
            onPress={spinComplete ? handleClaim : () => {}}
            disabled={!spinComplete || isClaiming}
          />
        </View>
      </View>
    </Modal>
  );
};

export default ChestOpening;
