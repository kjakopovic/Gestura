import { Modal, View, Text } from "react-native";
import React from "react";
import CustomButton from "../CustomButton";

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
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View className="w-full h-1/2 z-10"></View>
      <View className="w-full h-1/2 flex flex-col items-center justify-center bg-grayscale-800 border-t-2 border-grayscale-400 z-100">
        {success ? (
          <>
            <Text className="text-grayscale-100 text-4xl font-inter">
              You've bought{" "}
              <Text className="text-grayscale-100 text-4xl font-interBold">
                {item}
              </Text>
            </Text>
          </>
        ) : (
          <>
            <Text className="text-grayscale-100 text-4xl font-inter">
              Not enough coins!
            </Text>
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
