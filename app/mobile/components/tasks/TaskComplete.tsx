import { View, Text, Image } from "react-native";
import React from "react";
import { router } from "expo-router";

import * as characters from "@/constants/characters";
import * as icons from "@/constants/icons";

import CustomButton from "../CustomButton";

const TaskComplete = () => {
  const xpEarned = 40;
  const coinsEarned = 20;
  const percentageSolved = 93;

  const goToHome = () => {
    router.push("/(root)/(tabs)/Home");
  };

  return (
    <View className="flex-1 w-full h-full justify-center items-center top-1/3">
      <Image className="w-40 h-40" source={characters.character1_cut} />
      <Text className="text-white text-4xl font-interBold">Nice one!</Text>
      <Text className="text-white text-2xl font-inter">
        You&apos;ve completed the task.
      </Text>
      <View className="flex-row justify-between m-10 items-center w-80 h-20 border border-grayscale-400 rounded-xl">
        <View className="flex-row justify-center items-center w-20 h-10 border border-grayscale-400 rounded-xl mx-2">
          <Text className="text-blue-600 p-1 font-interBold text-xl">
            {xpEarned}
          </Text>
          <Image className="p-1" source={icons.experience_token} />
        </View>
        <View className="flex-row justify-center items-center w-20 h-10 border border-grayscale-400 rounded-xl mx-2">
          <Text className="text-success p-1 font-interBold text-xl">
            {percentageSolved}%
          </Text>
        </View>
        <View className="flex-row justify-center items-center w-20 h-10 border border-grayscale-400 rounded-xl mx-2">
          <Text className="text-yellow-400 p-1 font-interBold text-xl">
            {coinsEarned}
          </Text>
          <Image source={icons.coin} />
        </View>
      </View>
      <CustomButton
        onPress={goToHome}
        text="CONTINUE"
        style="base"
      ></CustomButton>
    </View>
  );
};

export default TaskComplete;
