import { create } from "zustand";

interface LevelStatsState {
  startedAt: string | null;
  finishedAt: string | null;
  correct_answers_versions: number[];
  language_id: string | null;
  letters_learned: string[];
  level_id: number | null;
  isLoading: boolean;
  error: string | null;
  setLevelId: (levelId: number | null) => void;
  setStartedAt: (timestamp: string | null) => void;
  setFinishedAt: (timestamp: string | null) => void;
  setCorrectAnswersVersions: (
    versions: number[] | ((prev: number[]) => number[])
  ) => void;
  setLanguageId: (languageId: string | null) => void;
  setLettersLearned: (
    letters: string[] | ((prev: string[]) => string[])
  ) => void;
  clearLevelStats: () => void;
}

export const useLevelStatsStore = create<LevelStatsState>()((set) => ({
  level_id: null,
  startedAt: null,
  finishedAt: null,
  correct_answers_versions: [],
  language_id: null,
  letters_learned: [],
  isLoading: false,
  error: null,
  setLevelId: (levelId: number | null) => set({ level_id: levelId }),
  setStartedAt: (timestamp: string | null) => set({ startedAt: timestamp }),
  setFinishedAt: (timestamp: string | null) => set({ finishedAt: timestamp }),
  setCorrectAnswersVersions: (
    versions: number[] | ((prev: number[]) => number[])
  ) =>
    set((state) => ({
      correct_answers_versions:
        typeof versions === "function"
          ? versions(state.correct_answers_versions)
          : versions,
    })),
  setLanguageId: (languageId: string | null) =>
    set({ language_id: languageId }),
  setLettersLearned: (letters: string[] | ((prev: string[]) => string[])) =>
    set((state) => ({
      letters_learned:
        typeof letters === "function"
          ? letters(state.letters_learned)
          : letters,
    })),
  clearLevelStats: () =>
    set({
      startedAt: null,
      finishedAt: null,
      correct_answers_versions: [],
      language_id: null,
      letters_learned: [],
      isLoading: false,
      error: null,
    }),
}));
