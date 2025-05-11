import React, { useEffect } from "react";
import { ScrollView, ActivityIndicator, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import Task from "@/components/tasks/Task";
import TaskComplete from "@/components/tasks/TaskComplete";
import { useLevel } from "@/hooks/useLevel";
import { useLevelTasks } from "@/hooks/useLevelTasks";

// Import the task data from a separate file
import { api } from "@/lib/api";
import { ApiTasksResponse } from "@/types/types";
import { LevelTask } from "@/hooks/useLevelTasks";
import { convertApiTaskToLevelTask } from "@/utils/levelTaskUtils";
import { useLevelStatsStore } from "@/store/useLevelStatsStore";
import CustomButton from "@/components/CustomButton";

const LevelScreen = () => {
  const { completeLevel } = useLevel();
  const params = useLocalSearchParams();
  const levelId = params.id ? parseInt(params.id as string, 10) : 3;
  const languageId = params.language || "usa";
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tasks, setTasks] = React.useState<LevelTask[]>([]);

  const setLevelId = useLevelStatsStore((state) => state.setLevelId);
  const setStartedAt = useLevelStatsStore((state) => state.setStartedAt);
  const setLanguageId = useLevelStatsStore((state) => state.setLanguageId);

  const fetchLevelTasks = async (): Promise<LevelTask[]> => {
    try {
      setLoading(true);
      const response = await api.get<ApiTasksResponse>(
        `/tasks?level=${levelId}&language=${languageId}`,
        { apiBase: "learning" }
      );

      if (response.success && response.data?.tasks) {
        setLanguageId(languageId.toString());
        setLevelId(levelId);
        setStartedAt(new Date().toISOString());
        return response.data.tasks.map(convertApiTaskToLevelTask);
      } else {
        setError("Failed to fetch tasks");
        console.error("Failed to fetch level tasks:", response.error);
        return [];
      }
    } catch (error) {
      console.error("Error fetching level tasks:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      const tasks = await fetchLevelTasks();
      if (tasks.length > 0) {
        setTasks(tasks);
      }
    };

    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId, languageId]);

  // Handle level completion
  const handleLevelComplete = (levelId: number, stats: any) => {
    console.log(`Level ${levelId} completed with stats:`, stats);
    completeLevel(levelId);
  };

  // Use the level tasks hook
  const {
    currentTask,
    completeTask,
    showCompletionScreen,
    completionStats,
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

  if (loading) {
    return (
      <View className="w-full h-full bg-grayscale-800 flex items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-4">Loading tasks...</Text>
      </View>
    );
  }

  if (error || tasks.length === 0) {
    return (
      <View className="w-full h-full bg-grayscale-800 flex items-center justify-center p-4">
        <Text className="text-white text-xl font-interSemiBold text-center mb-4">
          {error || "Coming soon..."}
        </Text>
        <Text className="text-white text-lg font-inter text-center">
          Please check back later or try a different level.
        </Text>
        <CustomButton text="Go to Home" onPress={goToHome} />
      </View>
    );
  }

  return (
    <ScrollView className="w-full h-full bg-grayscale-800">
      <SafeAreaView className="w-full h-full justify-center bg-grayscale-800">
        {showCompletionScreen ? (
          <TaskComplete stats={completionStats} onContinue={goToHome} />
        ) : (
          <Task
            key={`task-${currentTask.id}-${currentTask.version}`}
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
