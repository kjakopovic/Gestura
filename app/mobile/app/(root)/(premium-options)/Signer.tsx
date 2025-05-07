import { View, Text } from "react-native";
import React from "react";
import CustomButton from "@/components/CustomButton";

import { useRouter } from "expo-router";

const Signer = () => {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-grayscale-800">
      <Text className="text-white text-xl font-interExtraBold mb-8">
        The person is now signing.
      </Text>
      {/* TODO: ovdje ide kamera */}
      <View className="flex flex-col justify-center items-center border-2 border-grayscale-400 w-96 h-96 mt-4 rounded-xl" />
      <View className="flex flex-col justify-center items-start w-full px-12 py-4">
        <Text className="text-white text-2xl font-inter">
          • <Text className="text-xl">How are you?</Text>
        </Text>
        <Text className="text-white text-2xl font-inter">
          • <Text className="text-xl">My name is John.</Text>
        </Text>
      </View>
      <CustomButton
        text="SWITCH TO TALKER"
        style="base"
        onPress={() => router.push("/(root)/(premium-options)/Talker")}
      />
      <CustomButton
        text="CLOSE TRANSLATOR"
        style="error"
        onPress={() => router.push("/(root)/(tabs)/Premium")}
      />
    </View>
  );
};

export default Signer;
