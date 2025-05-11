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

import * as icons from "@/constants/icons";

import CustomButton from "@/components/CustomButton";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";

type UpgradeToPremiumProps = {
  hasButton?: boolean;
};

const UpgradeToPremium = ({ hasButton }: UpgradeToPremiumProps) => {
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setSubscription = useUserStore((state) => state.setSubscription);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.patch("/users", {
        subscription: 1,
      });
      if (response.success) {
        setSubscription(1); // Update the subscription in the store
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
            : "Unknown error";
        setError(errorMessage);
        console.error("Upgrade failed:", response.error); // Log the original error object
        Alert.alert("Upgrade Failed", errorMessage || "Please try again.");
      }
    } catch (err) {
      // Handle network or other errors
      console.error("Error during upgrade:", err);
      let catchErrorMessage = "An error occurred. Please try again.";
      if (err instanceof Error) {
        catchErrorMessage = err.message;
      } else if (typeof err === "string") {
        catchErrorMessage = err;
      } else if (err && typeof (err as any).message === "string") {
        catchErrorMessage = (err as any).message;
      }
      setError(catchErrorMessage);
      Alert.alert("Error", catchErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <View className="flex flex-col h-full bg-grayscale-800 justify-center items-center mx-6">
        <Text className="text-red-500 font-inter">{error}</Text>
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
    <View className="flex flex-col h-screen justify-start items-center mx-6 pb-3">
      <View className="flex flex-col justify-center items-center">
        <Image source={icons.logo} className="size-44" />
        <Text className="text-white font-inter text-4xl text-center mt-0">
          Embark on a journey using{" "}
          <Text className="text-white font-interBold">Premium</Text>!
        </Text>
      </View>
      <View className="flex flex-row justify-start items-center w-full">
        <Text className="text-white font-interLight text-lg m-1">You get:</Text>
      </View>
      <View className="flex flex-col justify-start items-center w-full border-2 border-grayscale-400 rounded-xl">
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

      <CustomButton text="SUBSCRIBE" style="primary" onPress={handleUpgrade} />
      {hasButton && (
        <TouchableOpacity className="w-1/2 justify-center items-center border border-grayscale-400 rounded-xl">
          <Text
            className="text-grayscale-100 font-inter p-4"
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
