import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import Task from "@/components/tasks/Task";
import TaskComplete from "@/components/tasks/TaskComplete";
import { useLevel } from "@/hooks/useLevel";
import { useLevelTasks } from "@/hooks/useLevelTasks";
import { getLevelTasks } from "@/utils/taskUtils";

// Import the task data from a separate file
import { levelTasksMap } from "@/data/levelTasks";

const LevelScreen = () => {
  const { completeLevel } = useLevel();
  const params = useLocalSearchParams();
  const levelId = params.id ? parseInt(params.id as string, 10) : 3;

  // Get tasks for the current level
  const levelTasks = getLevelTasks(levelId, levelTasksMap);

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
    tasks: levelTasks,
    levelId,
    onLevelComplete: handleLevelComplete,
  });

  // Handle task completion or failure
  const handleTaskComplete = (isCorrect: boolean) => {
    setTimeout(() => completeTask(isCorrect), 100);
  };

  return (
    <ScrollView className="w-full h-full bg-grayscale-800">
      <SafeAreaView className="w-full h-full justify-center bg-grayscale-800">
        {showCompletionScreen ? (
          <TaskComplete stats={completionStats} onContinue={goToHome} />
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
