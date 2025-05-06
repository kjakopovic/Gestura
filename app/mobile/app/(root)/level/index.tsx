import React, { useState, useEffect } from "react";
import { ScrollView, ActivityIndicator, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Task from "@/components/tasks/Task";
import TaskComplete from "@/components/tasks/TaskComplete";
import { useLevel } from "@/hooks/useLevel";
import { useLevelTasks, LevelTask } from "@/hooks/useLevelTasks";
import { fetchLevelTasks } from "@/utils/levelApi";

const LevelScreen = () => {
  const router = useRouter();
  const { completeLevel } = useLevel();
  const params = useLocalSearchParams();
  const levelId = params.id ? parseInt(params.id as string, 10) : 1;

  const [tasks, setTasks] = useState<LevelTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks for the level
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const levelTasks = await fetchLevelTasks(levelId);
        if (levelTasks.length > 0) {
          setTasks(levelTasks);
        } else {
          setError("No tasks found for this level.");
        }
      } catch (err) {
        setError("Failed to load tasks. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [levelId]);

  // Handle level completion
  const handleLevelComplete = (levelId: number, stats: any) => {
    console.log(`Level ${levelId} completed with stats:`, stats);
    completeLevel(levelId);
  };

  // Use the level tasks hook with fetched tasks
  const {
    currentTask,
    completeTask,
    showCompletionScreen,
    completionStats,
    correctTaskIndices,
    startTime,
    allTasks,
    goToHome,
  } = useLevelTasks({
    tasks,
    levelId,
    onLevelComplete: handleLevelComplete,
  });

  // Handle task completion or failure
  const handleTaskComplete = (isCorrect: boolean) => {
    setTimeout(() => completeTask(isCorrect), 100);
  };

  // Show loading state
  if (isLoading) {
    return (
      <View className="w-full h-full bg-grayscale-800 flex items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-4">Loading tasks...</Text>
      </View>
    );
  }

  // Show error state
  if (error || tasks.length === 0) {
    return (
      <View className="w-full h-full bg-grayscale-800 flex items-center justify-center p-4">
        <Text className="text-white text-lg text-center mb-4">
          {error || "No tasks available for this level."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="w-full h-full bg-grayscale-800">
      <SafeAreaView className="w-full h-full justify-center bg-grayscale-800">
        {showCompletionScreen ? (
          <TaskComplete
            stats={completionStats}
            onContinue={() => {
              goToHome(router);
            }}
            correctTasksIndices={correctTaskIndices}
            allTasks={allTasks}
            startTime={startTime}
            levelId={levelId}
          />
        ) : (
          <Task
            {...currentTask}
            onComplete={() => handleTaskComplete(true)}
            onFailure={() => handleTaskComplete(false)}
          />
        )}
      </SafeAreaView>
    </ScrollView>
  );
};

export default LevelScreen;
