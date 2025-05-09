import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  RefreshControl,
} from "react-native";
import CustomAppBar from "@/components/CustomAppBar";
import Table from "@/components/profile/Table";
import Achievement from "@/components/profile/Achievement";
import SettingSubtitle from "@/components/settings/SettingSubtitle";
import { api } from "@/lib/api";

type IAchievement = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  requires: number;
  type: string;
  acquired: boolean;
};

export interface AchievementsData {
  achievements: IAchievement[];
  next_token: string | null;
}

export interface AchievementsApiResponse {
  message: string;
  data: AchievementsData;
}

const Achievements = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [achievements, setAchievements] = React.useState<IAchievement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await api.get<AchievementsApiResponse>(
        "/achievements?query_page_size=10",
        {
          apiBase: "inventory",
        }
      );

      if (response.success && response.data) {
        setAchievements(response.data.data.achievements);
        console.log(
          "Achievements data loaded:",
          response.data.data.achievements
        );
      } else if (response.error) {
        setError("Failed to fetch achievements");
        console.error("Error fetching achievements data:", response.error);
      } else {
        console.error("Error fetching achievements data:", response.error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching achievements data:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAchievements();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedAchievements = achievements.filter((a) => a.acquired);
  const lockedAchievements = achievements.filter((a) => !a.acquired);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-grayscale-800">
        <CustomAppBar title="ACHIEVEMENTS" backButton />
        <ActivityIndicator
          size="large"
          color="#A162FF"
          className="flex-1 justify-center items-center"
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-grayscale-800">
        <CustomAppBar title="ACHIEVEMENTS" backButton />
        <View className="flex-1 justify-center items-center">
          <Text className="text-white">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <CustomAppBar title="ACHIEVEMENTS" backButton />
      <ScrollView
        className="bg-grayscale-800 mt-28 px-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#A162FF"]}
            tintColor="#A162FF"
            title="Refreshing achievements..."
            titleColor="#FFFFFF"
          />
        }
      >
        <SafeAreaView className="bg-grayscale-800 flex-1">
          <View className="mb-6 mt-12">
            <SettingSubtitle title="UNLOCKED" />
            <Table>
              {completedAchievements.map((achievement) => (
                <Achievement
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.image_url}
                  completed={achievement.acquired}
                />
              ))}
            </Table>
          </View>

          <View className="mb-6">
            <SettingSubtitle title="LOCKED" />
            <Table>
              {lockedAchievements.map((achievement) => (
                <Achievement
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.image_url}
                  completed={achievement.acquired}
                />
              ))}
            </Table>
          </View>
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default Achievements;
