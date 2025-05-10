import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";

import { useRouter } from "expo-router";

import * as icons from "@/constants/icons";

import CustomButton from "@/components/CustomButton";

type UpgradeToPremiumProps = {
  hasButton?: boolean;
};

const UpgradeToPremium = ({ hasButton }: UpgradeToPremiumProps) => {
  const router = useRouter();

  return (
    <View className="flex flex-col h-full bg-grayscale-800 justify-center items-center mx-6">
      <View className="flex flex-col justify-center items-center">
        <Image source={icons.logo} className="size-44 m-2 mt-20" />
        <Text className="text-white font-inter text-4xl text-center m-8 mt-0">
          Embark on a journey using{" "}
          <Text className="text-white font-interBold">Premium</Text>!
        </Text>
      </View>
      <View className="flex flex-row justify-start items-center w-full">
        <Text className="text-white font-interLight text-lg m-2">You get:</Text>
      </View>
      <View className="flex flex-col justify-start items-center w-full border-2 border-grayscale-400 rounded-xl mb-8">
        <View className="flex flex-col justify-center items-center w-full">
          <View className="flex flex-row justify-start items-center w-full">
            <Text className="text-white font-interBold text-base px-2 mx-4 border-b-2 border-l-2 border-r-2 rounded-b-xl border-grayscale-400">
              Premium
            </Text>
          </View>
          <View className="flex flex-row justify-between items-center w-full px-4 py-2 m-0">
            <Text className="text-white text-lg font-inter">
              Infinite Hearts
            </Text>
            <Image source={icons.heart} className="size-6 mr-12" />
          </View>
          <View className="flex flex-row justify-between items-center w-full px-4 py-2 m-0">
            <Text className="text-white text-lg font-interBold">No Ads</Text>
            <Image source={icons.ads} className="size-6 mr-12" />
          </View>
          <View className="flex flex-row justify-between items-center w-full px-4 py-2 m-0">
            <Text className="text-white text-lg font-inter">
              A{" "}
              <Text className="text-white text-lg font-interBold">Premium</Text>{" "}
              Profile Badge
            </Text>
            <Image source={icons.premiumBadge} className="size-6 mr-12" />
          </View>
        </View>
        <View className="w-full h-1 border-b-2 border-grayscale-400"></View>
        <View>
          <View className="flex flex-row justify-start items-center w-full">
            <Text className="text-primary font-interBold text-base px-2 mx-4 border-b-2 border-l-2 border-r-2 rounded-b-xl border-grayscale-400">
              Live
            </Text>
          </View>
          <View className="flex flex-row justify-between items-center w-full px-4 py-2 m-0">
            <Text className="text-white text-lg font-interBold">
              <Text className="text-primary">LIVE</Text> COMMUNICATION
            </Text>
            <Image source={icons.people} className="size-6 mr-12" />
          </View>
          <View className="flex flex-row justify-between items-center w-full px-4 py-2 m-0">
            <Text className="text-white text-lg font-inter">
              A{" "}
              <Text className="text-primary text-lg font-interBold">Live</Text>{" "}
              Profile Badge
            </Text>
            <Image source={icons.badge} className="size-6 mr-12" />
          </View>
        </View>
      </View>

      <CustomButton
        text="SUBSCRIBE"
        style="primary"
        onPress={() => {
          alert("Upgrade to Premium clicked!");
        }}
        noMargin={true}
      />
      {hasButton && (
        <TouchableOpacity className="w-1/2 m-6 mb-24 flex-1 justify-center items-center border border-grayscale-400 rounded-xl">
          <Text
            className="text-grayscale-100 font-inter"
            onPress={() => {
              router.back();
            }}
          >
            No, thanks
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UpgradeToPremium;
