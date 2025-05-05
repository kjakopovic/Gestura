import { View, Text, Image } from "react-native";
import React, { useEffect, useState } from "react";

import * as characters from "@/constants/characters";

import CustomButton from "../CustomButton";
import { LevelCompletionStats } from "@/hooks/useLevelTasks";
import { StatsDisplay } from "./task-components/StatsDisplay";
import { api } from "@/lib/api";
import { LevelTask } from "@/hooks/useLevelTasks";
import { extractLetterFromUrl } from "@/utils/taskUtils";
import { navigateToHome } from "@/utils/navigationUtils";

interface TaskCompleteProps {
  stats: LevelCompletionStats;
  onContinue?: () => void;
  completedTasks?: LevelTask[];
  correctTasksIndices?: number[];
  allTasks?: LevelTask[];
  startTime?: Date;
  levelId?: number;
}

interface ServerStats {
  xpEarned?: number;
  coinsEarned?: number;
  message?: string;
  percentage?: number;
}

const TaskComplete = ({
  stats,
  onContinue,
  completedTasks = [],
  correctTasksIndices = [],
  allTasks = [],
  startTime = new Date(Date.now() - 120000), // Default to 2 minutes ago if not provided
  levelId = 1,
}: TaskCompleteProps) => {
  const [serverStats, setServerStats] = useState<ServerStats>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const submitLevelCompletion = async () => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        // Get correct task versions
        const correctAnswersVersions: number[] = correctTasksIndices.map(
          (index) => allTasks[index]?.version || 0
        );

        // Extract letters learned from questions
        const lettersLearned: string[] = [];

        correctTasksIndices.forEach((index) => {
          const task = allTasks[index];
          if (!task) return;

          if (task.version === 1) {
            // Type 1: question is the letter or image URL
            lettersLearned.push(extractLetterFromUrl(task.question));
          } else if (task.version === 2) {
            // Type 2: question is the letter, extract it using our utility
            if (typeof task.question === "string") {
              lettersLearned.push(extractLetterFromUrl(task.question));
            }
          }
          // Skip type 3 questions
        });

        // Log the letters array for debugging
        console.log("Letters learned:", lettersLearned);

        const response = await api.post(
          "/levels/complete",
          {
            started_at: startTime.toISOString(),
            finished_at: new Date().toISOString(),
            correct_answers_versions: correctAnswersVersions,
            language_id: "usa",
            letters_learned: lettersLearned,
          },
          { apiBase: "learning" }
        );

        if (response.success && response.data) {
          // Type the response data as ServerStats to ensure TypeScript recognizes the properties
          const responseData = response.data as {
            xp: number;
            coins: number;
            message: string;
            percentage: number;
          };

          // Update stats with server response
          setServerStats({
            xpEarned: responseData.xp || stats.xpEarned,
            coinsEarned: responseData.coins || stats.coinsEarned,
            message: responseData.message,
            percentage: responseData.percentage,
          });
        } else {
          console.error("Failed to submit level completion:", response.error);
        }
      } catch (error) {
        console.error("Error submitting level completion:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    submitLevelCompletion();
  }, [allTasks, correctTasksIndices, levelId, startTime, stats]);

  // Handle continue button press
  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      navigateToHome();
    }
  };

  // Merge local stats with server stats
  const displayStats = {
    ...stats,
    ...(serverStats.xpEarned !== undefined && {
      xpEarned: serverStats.xpEarned,
    }),
    ...(serverStats.coinsEarned !== undefined && {
      coinsEarned: serverStats.coinsEarned,
    }),
    // Add percentage as an additional property without causing TypeScript errors
    percentage: serverStats.percentage,
  };

  return (
    <View className="flex-1 w-full h-full justify-center items-center mt-24">
      <Image className="w-40 h-40" source={characters.character1_cut} />
      <Text className="text-white text-4xl font-interBold">
        {serverStats.message || "Nice one!"}
      </Text>
      {!serverStats.message && (
        <Text className="text-white text-2xl font-inter">
          You&apos;ve completed the level.
        </Text>
      )}

      <StatsDisplay stats={displayStats} />

      <View className="w-full items-center px-8">
        <CustomButton onPress={handleContinue} text="CONTINUE" style="base" />
      </View>
    </View>
  );
};

export default TaskComplete;
