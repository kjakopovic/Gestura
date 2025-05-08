import { View, Text, Image } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";
import HeartRefillTimer from "./HeartRefillTimer";

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
    <View className="w-full bg-grayscale-700 shadow-sm shadow-grayscale-400 rounded-b-xl flex flex-row items-center justify-between px-6 pt-20">
      <View className="flex flex-row items-center mb-5">
        <Image source={icons.coin} className="size-6" />
        <Text className="text-primary text-xl font-interExtraBold ml-2">
          {coins}
        </Text>
      </View>

      {/* Level and Progress bar */}
      <View className="flex-1 items-center justify-center mx-10 mb-5">
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
      <View className="flex flex-col items-center">
        <View className="flex flex-row items-center">
          <Text className="text-error text-xl font-interExtraBold">
            {hearts}
          </Text>
          <Image source={icons.heart} className="size-6 ml-2" />
        </View>
        {hearts < 5 && <HeartRefillTimer refillTimestamp={heartsNextRefill!} />}
      </View>
    </View>
  );
};

export default PlayerInfoBar;
