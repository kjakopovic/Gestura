import { api } from "@/lib/api";
import { ApiTasksResponse, ApiTask } from "@/types/types";
import { LevelTask } from "@/hooks/useLevelTasks";

/**
 * Convert API task format to the app's LevelTask format
 */
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

/**
 * Fetch level tasks from the API
 */
export const fetchLevelTasks = async (
  levelId: number,
  language: string = "usa"
): Promise<LevelTask[]> => {
  try {
    const response = await api.get<ApiTasksResponse>(
      `/tasks?level=${levelId}&language=${language}`,
      { apiBase: "learning" }
    );

    if (response.success && response.data?.tasks) {
      return response.data.tasks.map(convertApiTaskToLevelTask);
    } else {
      console.error("Failed to fetch level tasks:", response.error);
      return [];
    }
  } catch (error) {
    console.error("Error fetching level tasks:", error);
    return [];
  }
};
