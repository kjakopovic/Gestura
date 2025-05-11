import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import React from "react";

import CustomAppBar from "@/components/CustomAppBar";
import * as images from "@/constants/images";
import { BattlepassLevel, useInventoryStore } from "@/store/useInventoryStore";
import BattlepassMap from "@/components/inventory/BattlepassMap";
import { api } from "@/lib/api";

const BattlePass = () => {
  const activeBattlepass = useInventoryStore((state) => state.activeBattlepass);

  const userBattlepass = useInventoryStore((state) => state.userBattlepass);

  const [claiming, setClaiming] = React.useState(false);
  const season = activeBattlepass.season;
  const seasonName = activeBattlepass.name;
  const endDate = activeBattlepass.end_date;

  const getDaysRemaining = () => {
    if (!endDate) return "Unknown";

    const now = new Date();
    const end = new Date(endDate);

    // Calculate difference in milliseconds
    const diffMs = end.getTime() - now.getTime();

    // Convert to days
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Ended";
    if (diffDays === 1) return "1 day";
    return `${diffDays} days`;
  };

  const daysRemaining = getDaysRemaining();

  const handleLevelPress = async (level: BattlepassLevel) => {
    // Check if level is unlocked and not already claimed
    if (
      userBattlepass.xp >= level.required_xp &&
      !userBattlepass.claimed_levels.includes(level.level)
    ) {
      try {
        setClaiming(true);
        const response = await api.post(
          `/battlepass/claim?battlepass_level=${level.level}`,
          {},
          {
            apiBase: "inventory",
          }
        );
        if (response.success) {
          // Update the userBattlepass state in the store
          useInventoryStore.setState((state) => ({
            userBattlepass: {
              ...state.userBattlepass,
              claimed_levels: [
                ...state.userBattlepass.claimed_levels,
                level.level,
              ],
            },
          }));
          Alert.alert(
            "Reward Claimed",
            `You have claimed ${level.coins} coins!`,
            [{ text: "OK" }]
          );
        } else {
          console.error("Error claiming level reward:", response.error);
        }
      } catch (error) {
        console.error("Error claiming level reward:", error);
      } finally {
        setClaiming(false);
      }
      // Show reward dialog or claim the reward
    }
  };

  if (claiming) {
    return (
      <SafeAreaView className="flex-1 items-center bg-grayscale-800">
        <ActivityIndicator
          size="large"
          color="#FFCC00"
          className="flex-1 justify-center items-center"
        />
      </SafeAreaView>
    );
  }

  return (
    <>
      <CustomAppBar title="BATTLE PASS" backButton />
      <SafeAreaView className="flex-1 items-center bg-grayscale-800">
        <ScrollView
          className="h-full w-full mt-20"
          contentContainerStyle={{
            paddingBottom: 120,
          }}
        >
          <View className="flex flex-col justify-center items-center mt-16 mb-20">
            <View className="absolute top-6 left-0 right-0 h-full items-center justify-center">
              <Image
                source={images.season_banner}
                className="w-full"
                resizeMode="contain"
              />
            </View>
            <Text className="text-lg text-primary font-interLight">
              Ends in {daysRemaining}
            </Text>
            <Text className="text-3xl text-primary font-interExtraBold">
              {season}
            </Text>
            <Text className="text-xl text-primary/50 font-interBold mb-4">
              {seasonName}
            </Text>
          </View>
          <View>
            <BattlepassMap
              levels={activeBattlepass.levels}
              userBattlepassXp={userBattlepass.xp}
              claimedLevels={userBattlepass.claimed_levels}
              onLevelPress={handleLevelPress}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default BattlePass;
