import { LevelTask } from "@/hooks/useLevelTasks";
import { ApiTask } from "@/types/types";

export const convertApiTaskToLevelTask = (apiTask: ApiTask): LevelTask => {
  return {
    id: apiTask.task_id,
    section: apiTask.section,
    sectionName: apiTask.section_name,
    version: apiTask.version,
    question: apiTask.question,
    possibleAnswers: apiTask.possible_answers,
    correctAnswerIndex: apiTask.correct_answer_index,
  };
};

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
