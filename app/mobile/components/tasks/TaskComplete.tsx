import { View, Text, Image } from "react-native";
import React, { useEffect, useState } from "react";

import * as characters from "@/constants/characters";

import CustomButton from "../CustomButton";
import { LevelCompletionStats } from "@/hooks/useLevelTasks";
import { navigateToHome } from "@/utils/navigationUtils";
import { StatsDisplay } from "./task-components/StatsDisplay";
import { useLevelStatsStore } from "@/store/useLevelStatsStore";
import { api } from "@/lib/api";
import { AchievementModal } from "./task-components/AchievementModal";

// Extract the Stats display into a separate component

interface TaskCompleteProps {
  stats: LevelCompletionStats;
  onContinue?: () => void;
}

const TaskComplete = ({ stats, onContinue }: TaskCompleteProps) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resultsSent, setResultsSent] = useState(false);

  const correct_answers_versions = useLevelStatsStore(
    (state) => state.correct_answers_versions
  );

  const [earnings, setEarnings] = useState({
    message: "",
    percentage: 0,
    coins: 0,
    xp: 0,
  });
  const letters_learned = useLevelStatsStore((state) => state.letters_learned);
  const language_id = useLevelStatsStore((state) => state.language_id);
  const started_at = useLevelStatsStore((state) => state.startedAt);
  const clearLevelStats = useLevelStatsStore((state) => state.clearLevelStats);

  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.post(
        "/levels/complete",
        {
          correct_answers_versions,
          letters_learned,
          language_id,
          started_at,
          finished_at: new Date().toISOString(),
        },
        { apiBase: "learning" }
      );

      // Type check the response data
      if (
        response.data &&
        typeof response.data === "object" &&
        "message" in response.data &&
        "percentage" in response.data &&
        "coins" in response.data &&
        "xp" in response.data
      ) {
        setEarnings({
          message: String(response.data.message),
          percentage: Number(response.data.percentage),
          coins: Number(response.data.coins),
          xp: Number(response.data.xp),
        });

        // Check for new achievements
        if (
          "new_achievements" in response.data &&
          Array.isArray(response.data.new_achievements) &&
          response.data.new_achievements.length > 0
        ) {
          setNewAchievements(response.data.new_achievements);
          setShowAchievementModal(true);
        }
      } else {
        setError("Invalid response format");
        console.error("Invalid earnings data structure:", response.data);
      }
    } catch (error) {
      setError("Failed to send level completion data");
      console.error("Error sending level completion data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (correct_answers_versions.length > 0 && !resultsSent) {
      setResultsSent(true); // Set flag to prevent further calls
      fetchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    correct_answers_versions,
    letters_learned,
    language_id,
    started_at,
    resultsSent,
  ]);

  // Handle continue button press
  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      clearLevelStats();
      navigateToHome();
    }
  };

  if (loading) {
    return (
      <View className="flex-1 w-full h-full justify-center items-center mt-24">
        <Text className="text-white text-2xl font-inter">Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 w-full h-full justify-center items-center mt-24">
        <Text className="text-white text-2xl font-inter">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 w-full h-full justify-center items-center mt-24">
      <Image className="w-40 h-40" source={characters.character1_cut} />
      <Text className="text-white text-4xl font-interBold">Nice one!</Text>
      <Text className="text-white text-2xl font-inter">
        You&apos;ve completed the level.
      </Text>

      <StatsDisplay stats={stats} earnings={earnings} />

      <View className="w-full items-center px-8">
        <CustomButton onPress={handleContinue} text="CONTINUE" style="base" />
      </View>

      {/* Achievement Modal */}
      {newAchievements.length > 0 && (
        <AchievementModal
          achievement={newAchievements[currentAchievementIndex]}
          isLastAchievement={
            currentAchievementIndex === newAchievements.length - 1
          }
          visible={showAchievementModal}
          onClose={() => {
            if (currentAchievementIndex < newAchievements.length - 1) {
              // Show next achievement
              setCurrentAchievementIndex(currentAchievementIndex + 1);
            } else {
              // Close modal after showing all achievements
              setShowAchievementModal(false);
              setCurrentAchievementIndex(0);
            }
          }}
        />
      )}
    </View>
  );
};

export default TaskComplete;
