import { View, Image, Text, TouchableOpacity } from "react-native";
import React from "react";

import { useRouter } from "expo-router";

import * as icons from "@/constants/icons";
import CustomButton from "../CustomButton";
import BenefitsList from "./BenefitsList";

const PremiumStatus = () => {
  const benefitCategories = [
    {
      title: "Premium",
      titleClass: "text-white",
      benefits: [
        { text: "Infinite Hearts", icon: icons.heart },
        { text: "No Ads", icon: icons.ads },
        { text: "Premium Profile Badge", icon: icons.premiumBadge },
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
        <Image source={icons.logo} className="size-44 m-2 mt-20" />
        <Text className="text-grayscale-100 font-inter text-4xl text-center m-8 mt-0">
          Your journey is on its way with{" "}
          <Text className="text-grayscale-100 font-interBold">Premium</Text>!
        </Text>
      </View>
      <View className="flex flex-row justify-start items-center w-full">
        <Text className="text-grayscale-100 font-interLight text-lg m-2">
          You get:
        </Text>
      </View>
      <BenefitsList categories={benefitCategories} />
      <Text className="text-grayscale-100 text-2xl font-interMedium text-center px-6 mb-6">
        You could still get more benefits with{" "}
        <Text className="text-primary font-interBold">LIVE</Text>
      </Text>
      <TouchableOpacity
        className="w-1/2 h-12 bg-grayscale-800 justify-center items-center border border-grayscale-400 rounded-xl mb-6"
        onPress={() => alert("upgrade clicked")}
      >
        <Text className="text-grayscale-100 font-inter text-base">
          Subscribe to <Text className="text-primary font-interBold">LIVE</Text>
        </Text>
      </TouchableOpacity>
      <CustomButton
        text="BACK TO MENU"
        style="base"
        onPress={handleBackToMenu}
        noMargin
      />
      <TouchableOpacity
        className="w-1/2 h-12 bg-grayscale-800 justify-center items-center border border-error rounded-xl mt-6"
        onPress={() => alert("canceled")}
      >
        <Text className="text-error font-inter text-base">
          Cancel Subscription
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PremiumStatus;
