import { View, Text, Image } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";
import LineProgressIndicator from "./progress_indicators/LineProgressIndicator";

const PlayerInfoBar = () => {
  const progress = 50; // Progress state (value between 0 and 100)

  return (
    <View className="w-full bg-grayscale-700 shadow-sm shadow-grayscale-400 rounded-b-xl flex flex-row items-center justify-between px-6 pt-20">
      <View className="flex flex-row items-center mb-5">
        <Image source={icons.coin} className="size-6" />
        <Text className="text-primary text-xl font-interExtraBold ml-2">
          123
        </Text>
      </View>

      {/* Level and Progress bar */}
      <View className="flex-1 items-center justify-center mx-10 mb-5">
        <Text className="text-secondary text-2xl font-interExtraBold mb-1">
          23
        </Text>
        <LineProgressIndicator style="xp" progress={progress} />
      </View>

      <View className="flex flex-row items-center mb-5">
        <Text className="text-error text-xl font-interExtraBold">5</Text>
        <Image source={icons.heart} className="size-6 ml-2" />
      </View>
    </View>
  );
};

export default PlayerInfoBar;
