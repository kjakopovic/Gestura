import { View, Text, Image } from "react-native";
import React, { useEffect, useState } from "react";

import * as characters from "@/constants/characters";

import CustomButton from "../CustomButton";
import { LevelCompletionStats } from "@/hooks/useLevelTasks";
import { navigateToHome } from "@/utils/navigationUtils";
import { StatsDisplay } from "./task-components/StatsDisplay";
import { api } from "@/lib/api";
import { LevelTask } from "@/hooks/useLevelTasks";

interface TaskCompleteProps {
  stats: LevelCompletionStats;
  onContinue?: () => void;
  completedTasks?: LevelTask[];
  correctTasksIndices?: number[];
  allTasks?: LevelTask[];
  startTime?: Date;
  levelId?: number;
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
  const [serverStats, setServerStats] = useState<{
    xpEarned?: number;
    coinsEarned?: number;
  }>({});
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
            // Type 1: question is the letter
            lettersLearned.push(task.question.toLowerCase());
          } else if (task.version === 2) {
            // Type 2: question is the letter, parse from URL if needed
            if (task.question.includes(".png")) {
              // Extract letter from URL
              const letter = task.question.split("/").pop()?.split(".")[0];
              if (letter) lettersLearned.push(letter.toLowerCase());
            } else {
              lettersLearned.push(task.question.toLowerCase());
            }
          }
          // Skip type 3 questions
        });

        const response = await api.post(
          "/levels/complete",
          {
            level_id: levelId,
            started_at: startTime.toISOString(),
            finished_at: new Date().toISOString(),
            correct_answers_versions: correctAnswersVersions,
            language_id: "usa",
            letters_learned: lettersLearned,
          },
          { apiBase: "learning" }
        );

        if (response.success && response.data) {
          // Update stats with server response
          setServerStats({
            xpEarned: response.data.xp || stats.xpEarned,
            coinsEarned: response.data.coins || stats.coinsEarned,
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
    console.log("TaskComplete continue button pressed");

    if (onContinue) {
      onContinue();
    } else {
      navigateToHome();
    }
  };

  // Merge local stats with server stats
  const displayStats = {
    ...stats,
    ...(serverStats.xpEarned && { xpEarned: serverStats.xpEarned }),
    ...(serverStats.coinsEarned && { coinsEarned: serverStats.coinsEarned }),
  };

  return (
    <View className="flex-1 w-full h-full justify-center items-center mt-24">
      <Image className="w-40 h-40" source={characters.character1_cut} />
      <Text className="text-white text-4xl font-interBold">Nice one!</Text>
      <Text className="text-white text-2xl font-inter">
        You&apos;ve completed the level.
      </Text>

      <StatsDisplay stats={displayStats} />

      <View className="w-full items-center px-8">
        <CustomButton onPress={handleContinue} text="CONTINUE" style="base" />
      </View>
    </View>
  );
};

export default TaskComplete;
