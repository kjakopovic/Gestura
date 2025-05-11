import { View, Text, Image } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";
import HeartRefillTimer from "./HeartRefillTimer";
import { SafeAreaView } from "react-native-safe-area-context";

type PlayerInfoBarProps = {
  level: number;
  progress: number;
  coins: number;
  hearts: number;
  heartsNextRefill?: string | null;
};

const PlayerInfoBar = ({
  level,
  progress,
  coins,
  hearts,
  heartsNextRefill,
}: PlayerInfoBarProps) => {
  return (
    <SafeAreaView className="w-full bg-grayscale-700 shadow-sm shadow-grayscale-400 rounded-b-xl flex flex-row items-center justify-between px-6 pt-2">
      <View className="flex flex-row items-center w-28">
        <Image source={icons.coin} className="size-6" />
        <Text className="text-primary text-xl font-interExtraBold ml-2">
          {coins > 1000 ? `${(coins / 1000).toFixed(1)}k` : coins}
        </Text>
      </View>

      {/* Level and Progress bar */}
      <View className="flex-1 mx-auto w-10 items-center justify-center mb-5">
        <Text className="text-secondary text-2xl font-interExtraBold mb-1">
          {level}
        </Text>
        <View className="h-4 w-full bg-grayscale-500 rounded-full">
          <View
            className="h-full bg-secondary rounded-full"
            style={{ width: `${progress}%` }}
          ></View>
        </View>
      </View>
      <View className="flex flex-col items-end justify-center w-28">
        <View className="flex flex-row items-center">
          <Text className="text-error text-xl font-interExtraBold">
            {hearts}
          </Text>
          <Image source={icons.heart} className="size-6 ml-2" />
        </View>
        {hearts < 5 && <HeartRefillTimer refillTimestamp={heartsNextRefill!} />}
      </View>
    </SafeAreaView>
  );
};

export default PlayerInfoBar;
