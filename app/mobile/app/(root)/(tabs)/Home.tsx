import { ScrollView, View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import PlayerInfoBar from "@/components/PlayerInfoBar";
import LevelMap from "@/components/levels/LevelMap";
import { LevelData } from "@/types/levels";
import * as icons from "@/constants/icons";

const Home = () => {
  const router = useRouter();
  // Levels data with their types and states
  // TODO: Add infinite loading with repeating cycle every 10 levels
  const [levels, setLevels] = useState<LevelData[]>([
    {
      id: 1,
      level: 1,
      type: "special",
      state: "unlocked",
      icon: icons.star1,
    },
    {
      id: 2,
      level: 2,
      type: "normal",
      state: "unlocked",
      icon: icons.star2,
    },
    {
      id: 3,
      level: 3,
      type: "special",
      state: "unlocked",
      icon: icons.star1,
    },
    {
      id: 4,
      level: 4,
      type: "normal",
      state: "locked",
      icon: icons.star2,
    },
    {
      id: 5,
      level: 5,
      type: "special",
      state: "locked",
      icon: icons.starTrophy,
    },
    {
      id: 6,
      level: 6,
      type: "special",
      state: "locked",
      icon: icons.starTrophy,
    },
    {
      id: 7,
      level: 7,
      type: "normal",
      state: "locked",
      icon: icons.star1,
    },
    {
      id: 8,
      level: 8,
      type: "normal",
      state: "locked",
      icon: icons.star2,
    },
  ]);

  const handleLevelPress = (levelId: number) => {
    console.log(`Level ${levelId} press`);
    router.push(`/level`);
    // Here you can navigate to the level or show a modal
  };

  return (
    <View className="bg-grayscale-800 flex-1">
      <PlayerInfoBar />
      <ScrollView
        className="h-full w-full"
        contentContainerStyle={{
          paddingBottom: 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {/* Level Map */}
        <View className="mt-20">
          <LevelMap levels={levels} onLevelPress={handleLevelPress} />
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;
