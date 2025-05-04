import { LevelTask } from "@/hooks/useLevelTasks";

/**
 * Calculate level completion statistics
 */
export const calculateLevelStats = (
  correctTasks: number,
  totalTasks: number
) => {
  const xpPerCorrectAnswer = 10;
  const coinsPerCorrectAnswer = 5;
  const percentageCorrect =
    totalTasks > 0 ? Math.round((correctTasks / totalTasks) * 100) : 0;

  return {
    xpEarned: correctTasks * xpPerCorrectAnswer,
    coinsEarned: correctTasks * coinsPerCorrectAnswer,
    percentageCorrect,
    totalTasks,
    correctTasks,
  };
};

/**
 * Get default tasks for a level (used as fallback if API fails)
 */
export const getDefaultTasks = (levelId: number): LevelTask[] => [
  {
    id: `task_default_${levelId}_1`,
    section: levelId * 10,
    sectionName: `Level ${levelId}`,
    version: 1,
    question: "https://example.com/images/handsign_a.png",
    possibleAnswers: ["A", "B", "C", "D"],
    correctAnswerIndex: 0,
  },
  {
    id: `task_default_${levelId}_2`,
    section: levelId * 10,
    sectionName: `Level ${levelId}`,
    version: 2,
    question: "B",
    possibleAnswers: [
      "https://example.com/images/handsign_a.png",
      "https://example.com/images/handsign_b.png",
      "https://example.com/images/handsign_c.png",
      "https://example.com/images/handsign_d.png",
    ],
    correctAnswerIndex: 1,
  },
];
