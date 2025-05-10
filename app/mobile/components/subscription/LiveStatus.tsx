import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import React from "react";

import { useRouter } from "expo-router";

import BenefitsList from "./BenefitsList";

import * as icons from "@/constants/icons";
import CustomButton from "../CustomButton";
import { useUserStore } from "@/store/useUserStore";
import { api } from "@/lib/api";

const LiveStatus = () => {
  const benefitCategories = [
    {
      title: "Live",
      titleClass: "text-primary",
      benefits: [
        { text: "Infinite Hearts", icon: icons.heart },
        { text: "No Ads", icon: icons.ads },
        { primaryText: "LIVE COMMUNICATION", icon: icons.people },
        { primaryText: "Live Profile Badge", icon: icons.badge },
      ],
    },
  ];

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const setSubscription = useUserStore((state) => state.setSubscription);

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.patch("/users", {
        subscription: 0,
      });
      if (response.success) {
        setSubscription(0); // Update the subscription in the store
        // Handle successful cancellation
        Alert.alert(
          "Cancellation Successful",
          "Your subscription has been successfully cancelled.",
          [
            {
              text: "OK",
              onPress: () => {
                router.back();
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        // Ensure a string is passed to setError
        const errorMessage =
          typeof response.error === "string"
            ? response.error
            : response.error &&
              typeof (response.error as any).message === "string"
            ? (response.error as any).message
            : "Unknown error occurred";
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error during cancellation:", error);
      // Handle network or other errors
      setError("An error occurred while cancelling. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const router = useRouter();

  const handleBackToMenu = () => {
    router.back();
  };

  if (error) {
    return (
      <View className="flex flex-col bg-grayscale-800 justify-center items-center mx-6">
        <Text className="text-error font-inter text-base">{error}</Text>
        <CustomButton
          text="BACK TO MENU"
          style="base"
          onPress={handleBackToMenu}
          noMargin
        />
      </View>
    );
  }
  if (loading) {
    return (
      <View className="flex flex-col bg-grayscale-800 justify-center items-center mx-6">
        <ActivityIndicator
          size="large"
          color="#A162FF"
          className="absolute top-1/2"
          style={{ transform: [{ translateY: -50 }] }}
        />
      </View>
    );
  }

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
          onPress={handleCancelSubscription}
        >
          Cancel Subscription
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LiveStatus;
