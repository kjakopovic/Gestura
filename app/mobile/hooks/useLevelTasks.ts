import { useState, useCallback } from "react";
import { calculateLevelStats } from "@/utils/taskUtils";
import { navigateToHome } from "@/utils/navigationUtils";

export interface LevelTask {
  id: string;
  section: number;
  sectionName: string;
  version: number;
  question: string;
  possibleAnswers: string[];
  correctAnswerIndex: number;
}

interface UseLevelTasksProps {
  tasks: LevelTask[];
  levelId: number;
  onLevelComplete: (levelId: number, stats: LevelCompletionStats) => void;
}

export interface LevelCompletionStats {
  xpEarned: number;
  coinsEarned: number;
  percentageCorrect: number;
  totalTasks: number;
  correctTasks: number;
}

export const useLevelTasks = ({
  tasks,
  levelId,
  onLevelComplete,
}: UseLevelTasksProps) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<boolean[]>([]);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [correctTaskIndices, setCorrectTaskIndices] = useState<number[]>([]);
  const [startTime] = useState<Date>(new Date());
  const [completionStats, setCompletionStats] = useState<LevelCompletionStats>({
    xpEarned: 0,
    coinsEarned: 0,
    percentageCorrect: 0,
    totalTasks: tasks.length,
    correctTasks: 0,
  });

  // Check if we're on the last task
  const isLastTask = currentTaskIndex === tasks.length - 1;

  // Get the current task
  const currentTask = tasks[currentTaskIndex];

  // Record task result and move to next task
  const completeTask = useCallback(
    (isCorrect: boolean) => {
      // Make a copy of completed tasks and mark current task
      const updatedCompletedTasks = [...completedTasks];
      updatedCompletedTasks[currentTaskIndex] = isCorrect;
      setCompletedTasks(updatedCompletedTasks);

      // Track correct task indices for API submission
      if (isCorrect) {
        setCorrectTaskIndices((prev) => [...prev, currentTaskIndex]);
      }

      // Calculate stats
      const correctCount = updatedCompletedTasks.filter(Boolean).length;
      const stats = calculateLevelStats(correctCount, tasks.length);

      // Update stats
      setCompletionStats(stats);

      // If this is the last task, show completion screen
      if (isLastTask) {
        setShowCompletionScreen(true);
        onLevelComplete(levelId, stats);
      } else {
        // Move to next task
        setCurrentTaskIndex((prev) => prev + 1);
      }
    },
    [
      currentTaskIndex,
      completedTasks,
      tasks.length,
      isLastTask,
      levelId,
      onLevelComplete,
    ]
  );

  // Reset the level to start over
  const resetLevel = useCallback(() => {
    setCurrentTaskIndex(0);
    setCompletedTasks([]);
    setShowCompletionScreen(false);
  }, []);

  return {
    currentTask,
    completeTask,
    isLastTask,
    currentTaskIndex,
    totalTasks: tasks.length,
    showCompletionScreen,
    completionStats,
    correctTaskIndices,
    startTime,
    allTasks: tasks,
    goToHome: navigateToHome,
    resetLevel,
  };
};
