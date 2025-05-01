import { Modal, View, Text, Image } from "react-native";
import React from "react";
import CustomButton from "../CustomButton";

import * as icons from "@/constants/icons";

type PurchaseResultProps = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  item: string;
  success: boolean;
};

const PurchaseResult = ({
  visible,
  setVisible,
  item,
  success,
}: PurchaseResultProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View className="w-full h-1/2 z-10"></View>
      <View className="w-full h-1/2 flex flex-col items-center justify-center bg-grayscale-800 border-t-2 border-grayscale-400 z-100">
        {success ? (
          <>
            <Text className="text-grayscale-100 text-4xl font-inter m-8">
              You've bought{" "}
              <Text className="text-grayscale-100 text-4xl font-interBold">
                {item}
              </Text>
              !
            </Text>
          </>
        ) : (
          <>
            <Text className="text-grayscale-100 text-4xl font-inter">
              Not enough{" "}
              <Text className="text-grayscale-100 text-4xl font-interBold">
                coins
              </Text>
              !
            </Text>
            <Image
              source={icons.coin}
              className="w-10 h-10 mt-6"
              resizeMode="contain"
            />
          </>
        )}

        <CustomButton
          text="CONTINUE"
          style="base"
          onPress={() => setVisible(false)}
        />
      </View>
    </Modal>
  );
};

export default PurchaseResult;
