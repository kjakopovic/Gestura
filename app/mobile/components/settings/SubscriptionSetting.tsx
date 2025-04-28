import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import CustomButton from "../CustomButton";
import * as icons from "@/constants/icons";

const SubscriptionSetting = () => {
  return (
    <TouchableOpacity
      className="flex-col mx-5 items-center rounded-2xl my-2 p-4 border border-grayscale-400"
      onPress={() => {}}
    >
      <Text className="flex-1 text-2xl font-interLight text-grayscale-100">
        No subscription?
      </Text>
      <Text className="flex-1 text-2xl font-interBold text-grayscale-100">
        Get Benefits Now!
      </Text>
      <Image source={icons.logo} className="my-4 size-16" />
      <CustomButton text="SUBSCRIBE" style="base" onPress={() => {}} noMargin />
    </TouchableOpacity>
  );
};

export default SubscriptionSetting;
