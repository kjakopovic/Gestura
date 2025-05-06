import { create } from "zustand";
import { UserData, LanguageData, ApiUserResponse } from "@/types/types";

interface UserState {
  // User data
  user: UserData | null;
  languages: LanguageData[];
  selectedLanguage: string | null;
  heartsNextRefill: string | null; // Add this to store the refill timestamp

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (userData: UserData) => void;
  setLanguages: (languages: LanguageData[]) => void;
  setSelectedLanguage: (languageId: string) => void;
  updateUserPreference: <K extends keyof UserData>(
    key: K,
    value: UserData[K]
  ) => void;
  setUserDataFromApi: (apiResponse: ApiUserResponse) => void;
  setHeartsNextRefill: (timestamp: string | null) => void;
  clearUserData: () => void;
}

// Create the store without persistence
export const useUserStore = create<UserState>()((set, get) => ({
  // Initial state
  user: null,
  languages: [],
  selectedLanguage: null,
  heartsNextRefill: null, // Initialize with null
  isLoading: false,
  error: null,

  // Actions
  setUser: (userData) => set({ user: userData }),

  setLanguages: (languages) => set({ languages }),

  setSelectedLanguage: (languageId) => set({ selectedLanguage: languageId }),

  updateUserPreference: (key, value) =>
    set((state) => ({
      user: state.user ? { ...state.user, [key]: value } : null,
    })),

  setHeartsNextRefill: (timestamp) => set({ heartsNextRefill: timestamp }),

  setUserDataFromApi: (apiResponse) => {
    if (apiResponse.users && apiResponse.languages) {
      set({
        user: apiResponse.users,
        languages: apiResponse.languages,
        // Set default selected language if not already set
        selectedLanguage:
          get().selectedLanguage ||
          (apiResponse.languages.length > 0
            ? apiResponse.languages[0].id
            : null),
      });
    }
  },

  clearUserData: () =>
    set({ user: null, selectedLanguage: null, heartsNextRefill: null }),
}));
