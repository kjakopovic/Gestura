import {
  View,
  Image,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import React from "react";

import { useRouter } from "expo-router";

import * as icons from "@/constants/icons";
import CustomButton from "../CustomButton";
import BenefitsList from "./BenefitsList";
import { useUserStore } from "@/store/useUserStore";
import { api } from "@/lib/api";

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

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const setSubscription = useUserStore((state) => state.setSubscription);
  const router = useRouter();

  const handleUpgrade = async () => {
    try {
      const response = await api.patch("/users", {
        subscription: 2,
      });
      if (response.success) {
        setSubscription(2); // Update the subscription in the store
        // Handle successful upgrade
        Alert.alert(
          "Upgrade Successful",
          "You have successfully upgraded to Premium!",
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
      console.error("Error during upgrade:", error);
      // Handle network or other errors
      setError("An error occurred while upgrading. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      <View className="flex flex-col h-full bg-grayscale-800 justify-center items-center mx-6">
        <ActivityIndicator size="large" color="#A162FF" />
      </View>
    );
  }

  return (
    <View className="flex flex-col bg-grayscale-800 justify-between h-full items-center mx-6 pb-3">
      <View className="flex flex-col justify-center items-center">
        <Image source={icons.logo} className="size-44" />
        <Text className="text-grayscale-100 font-inter text-4xl text-center mt-0">
          Your journey is on its way with{" "}
          <Text className="text-grayscale-100 font-interBold">Premium</Text>!
        </Text>
      </View>
      <View className="flex flex-row justify-start items-center w-full">
        <Text className="text-grayscale-100 font-interLight text-lg m-1">
          You get:
        </Text>
      </View>
      <BenefitsList categories={benefitCategories} />
      <Text className="text-grayscale-100 text-2xl font-interMedium text-center px-6">
        You could still get more benefits with{" "}
        <Text className="text-primary font-interBold">LIVE</Text>
      </Text>
      <TouchableOpacity
        className="w-1/2 h-12 bg-grayscale-800 justify-center items-center border border-grayscale-400 rounded-xl"
        onPress={handleUpgrade}
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
        className="w-1/2 h-12 bg-grayscale-800 justify-center items-center border border-error rounded-xl"
        onPress={handleCancelSubscription}
      >
        <Text className="text-error font-inter text-base">
          Cancel Subscription
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PremiumStatus;
