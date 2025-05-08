import { useState, useCallback } from "react";
import { calculateLevelStats } from "@/utils/taskUtils";
import { navigateToHome } from "@/utils/navigationUtils";
import { useLevelStatsStore } from "@/store/useLevelStatsStore";
import { extractLetterFromUrl } from "@/utils/levelTaskUtils";

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

export interface Earnings {
  message: string;
  percentage: number;
  coins: number;
  xp: number;
}

export const useLevelTasks = ({
  tasks,
  levelId,
  onLevelComplete,
}: UseLevelTasksProps) => {
  const setLettersLearned = useLevelStatsStore(
    (state) => state.setLettersLearned
  );
  const setCorrectAnswersVersions = useLevelStatsStore(
    (state) => state.setCorrectAnswersVersions
  );

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<boolean[]>([]);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
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

      if (isCorrect) {
        if (currentTask.version === 3) {
          setCorrectAnswersVersions((prev) => [...prev, currentTask.version]);
          console.log(`Version 3 task completed - No letter learning`);
        } else {
          let letterLearned = currentTask.question;

          if (currentTask.version === 1) {
            // Extract the letter from the URL
            letterLearned = extractLetterFromUrl(currentTask.question);
            console.log(
              `Extracted letter from URL: ${letterLearned} from ${currentTask.question}`
            );
          } else if (currentTask.version === 2) {
            letterLearned = letterLearned.toLowerCase();
          }

          setLettersLearned((prev) => {
            return prev.includes(letterLearned)
              ? prev
              : [...prev, letterLearned];
          });

          console.log(
            `Letter learned: ${letterLearned} from task version ${currentTask.version}`
          );

          // Track the version of correct answers
          setCorrectAnswersVersions((prev) => [...prev, currentTask.version]);
        }
      }

      // Calculate stats
      const correctCount = updatedCompletedTasks.filter(Boolean).length;
      const stats = calculateLevelStats(correctCount, tasks.length);

      // Update stats
      setCompletionStats(stats);

      // If this is the last task, show completion screen
      if (isLastTask) {
        // Important: Set the completion time here
        useLevelStatsStore.getState().setFinishedAt(new Date().toISOString());

        // Use setTimeout to break potential render cycles
        setTimeout(() => {
          setShowCompletionScreen(true);
          onLevelComplete(levelId, stats);
        }, 0);
      } else {
        // Move to next task
        setCurrentTaskIndex((prev) => prev + 1);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentTaskIndex,
      completedTasks,
      tasks.length,
      levelId,
      onLevelComplete,
      currentTask,
      setLettersLearned,
      setCorrectAnswersVersions,
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
    goToHome: navigateToHome,
    resetLevel,
  };
};
