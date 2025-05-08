import { SafeAreaView, ScrollView, View, Text, Image } from "react-native";
import React, { useState } from "react";

import CustomAppBar from "@/components/CustomAppBar";
import { LevelData } from "@/types/levels";
import * as icons from "@/constants/icons";
import * as images from "@/constants/images";
import LevelMap from "@/components/levels/LevelMap";

const BattlePass = () => {
  const season = 1;
  const seasonName = "LIGHTS OUT";

  const [levels] = useState<LevelData[]>([
    {
      id: 1,
      level: 1,
      type: "special",
      style: "battlepass",
      pathStyle: "battlepass",
      state: "unlocked",
      icon: icons.bp_chest_map,
    },
    {
      id: 2,
      level: 2,
      type: "special",
      style: "battlepass",
      pathStyle: "battlepass",
      state: "unlocked",
      icon: icons.coin,
    },
    {
      id: 3,
      level: 3,
      type: "special",
      style: "battlepass",
      pathStyle: "battlepass",
      state: "unlocked",
      icon: icons.coin,
    },
    {
      id: 4,
      level: 4,
      type: "special",
      style: "battlepass",
      pathStyle: "battlepass",
      state: "locked",
      icon: icons.coin,
    },
    {
      id: 5,
      level: 5,
      type: "special",
      style: "battlepass",
      pathStyle: "battlepass",
      state: "locked",
      icon: icons.bp_chest_map,
    },
    {
      id: 6,
      level: 6,
      type: "special",
      style: "battlepass",
      pathStyle: "battlepass",
      state: "locked",
      icon: icons.coin,
    },
    {
      id: 7,
      level: 7,
      type: "special",
      style: "battlepass",
      pathStyle: "battlepass",
      state: "locked",
      icon: icons.coin,
    },
    {
      id: 8,
      level: 8,
      type: "special",
      style: "battlepass",
      pathStyle: "battlepass",
      state: "locked",
      icon: icons.coin,
    },
  ]);

  const handleLevelPress = (levelId: number) => {
    alert("claimed reward " + levelId);
  };

  return (
    <>
      <CustomAppBar title="BATTLE PASS" backButton />
      <SafeAreaView className="flex-1 items-center bg-grayscale-800">
        <ScrollView
          className="h-full w-full"
          contentContainerStyle={{
            paddingBottom: 120,
          }}
        >
          <View className="flex flex-col justify-center items-center mt-24 mb-20">
            <View className="absolute top-6 left-0 right-0 h-full items-center justify-center">
              <Image
                source={images.season_banner}
                className="w-full"
                resizeMode="contain"
              />
            </View>

            <Text className="text-3xl text-primary font-interExtraBold">
              SEASON {season}
            </Text>
            <Text className="text-xl text-primary/50 font-interBold">
              {seasonName}
            </Text>
          </View>
          <View>
            <LevelMap
              levels={levels}
              onLevelPress={handleLevelPress}
              pathStyle="battlepass"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default BattlePass;
