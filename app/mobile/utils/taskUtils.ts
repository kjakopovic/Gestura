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
 * Extract letter from a URL or text string
 * Handles various URL formats to extract just the letter
 */
export const extractLetterFromUrl = (input: string): string => {
  // Return as-is if it's already a single letter
  if (input.length === 1) {
    return input.toLowerCase();
  }

  // Check if this is a URL with .png extension
  if (input.includes(".png")) {
    // Try multiple regex patterns to extract the letter

    // Pattern 1: Extract letter before .png
    let match = input.match(/\/([a-zA-Z0-9]+)\.png$/);
    if (match && match[1] && match[1].length === 1) {
      return match[1].toLowerCase();
    }

    // Pattern 2: For URLs like s3.amazonaws.com/asl/p.png
    match = input.match(/\/asl\/([a-zA-Z0-9])\.png$/);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }

    // Fallback: Just extract the filename before .png
    const parts = input.split("/");
    const filename = parts[parts.length - 1];
    if (filename && filename.includes(".png")) {
      const letter = filename.split(".")[0];
      if (letter.length === 1) {
        return letter.toLowerCase();
      }
    }
  }

  // If nothing else worked, just return the input as-is (but lowercase)
  // This keeps single-letter inputs working while logging a warning for unexpected formats
  console.warn(`Could not extract letter from: ${input}`);
  return input.toLowerCase();
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
