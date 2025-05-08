import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";

import { useRouter } from "expo-router";

import BenefitsList from "./BenefitsList";

import * as icons from "@/constants/icons";
import CustomButton from "../CustomButton";

const LiveStatus = () => {
  const benefitCategories = [
    {
      title: "Live",
      titleClass: "text-primary",
      benefits: [
        { text: "Infinite Hearts", icon: icons.heart },
        { text: "No Ads", icon: icons.ads },
        { text: "LIVE COMMUNICATION", icon: icons.people },
        { text: "Live Profile Badge", icon: icons.badge },
      ],
    },
  ];

  const router = useRouter();

  const handleBackToMenu = () => {
    router.back();
  };
  return (
    <View className="flex flex-col bg-grayscale-800 justify-center items-center mx-6">
      <View className="flex flex-col justify-center items-center">
        <Image source={icons.logoG} className="size-44 m-2 mt-20" />
        <Text className="text-grayscale-100 font-inter text-4xl text-center m-8 mt-0">
          Your journey is aided with{" "}
          <Text className="text-primary font-interBold">Live</Text>!
        </Text>
      </View>
      <View className="flex flex-row justify-start items-center w-full">
        <Text className="text-grayscale-100 font-interLight text-lg m-2">
          You get:
        </Text>
      </View>
      <BenefitsList categories={benefitCategories} />
      <Text className="text-grayscale-100 font-interBold text-2xl mb-12">
        Thank you for your support!
      </Text>
      <CustomButton
        text="BACK TO MENU"
        style="base"
        onPress={handleBackToMenu}
        noMargin
      />
      <TouchableOpacity className="w-1/2 h-12 bg-grayscale-800 justify-center items-center border border-error rounded-xl mt-6">
        <Text
          className="text-error font-inter text-base"
          onPress={() => alert("canceled")}
        >
          Cancel Subscription
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LiveStatus;
