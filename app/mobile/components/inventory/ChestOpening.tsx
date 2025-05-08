import {
  View,
  Text,
  Modal,
  Image,
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import React, { useEffect, useRef } from "react";

import CustomButton from "../CustomButton";
import ChestItem from "./ChestItem";

import * as icons from "@/constants/icons";

type ChestOpeningProps = {
  onClose: () => void;
};

const ChestOpening = ({ onClose }: ChestOpeningProps) => {
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

  const [spinComplete, setSpinComplete] = React.useState(false);

  const [winningIndex, setWinningIndex] = React.useState(0);

  const ITEM_HEIGHT = 60;
  // const ITEMS_VISIBLE = 5;
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

  return (
    <Modal visible={true} transparent={true} animationType="slide">
      <View className="w-full h-full bg-grayscale-800 flex flex-col items-center justify-center">
        {/* nije mi radilo w-full m-20 */}
        <View className="w-3/4 h-3/4 bg-grayscale-700 border border-grayscale-400 rounded-xl flex flex-col justify-bewtween items-center">
          <View className="w-full flex flex-row justify-center items-center p-8 border-b border-grayscale-400">
            <Image source={icons.bp_chest} className="size-20" />
          </View>
          <View
            // style={{ height: 300, paddingTop: 20 }}
            className="w-full mt-24 items-center justify-center relative overflow-hidden border-t border-b border-grayscale-400"
          >
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

          {spinComplete && (
            <View className="bg-grayscale-600 pt-4 rounded-xl mt-1">
              <Text className="text-xl text-primary font-interBold text-center">
                You won {spinnerItems[winningIndex]?.value} coins!
              </Text>
            </View>
          )}
          <CustomButton
            text={spinComplete ? "CLAIM" : "SPINNING..."}
            style="base"
            onPress={spinComplete ? onClose : () => {}}
            disabled={!spinComplete}
          />
        </View>
      </View>
    </Modal>
  );
};

export default ChestOpening;
