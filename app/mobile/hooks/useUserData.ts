import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { ApiUserResponse, HeartsApiResponse } from "@/types/types"; // Added HeartsApiResponse
import { useUserStore } from "@/store/useUserStore";

export const useUserData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setUserDataFromApi = useUserStore((state) => state.setUserDataFromApi);
  const setHeartsNextRefill = useUserStore(
    (state) => state.setHeartsNextRefill
  ); // Added next refill state
  const userData = useUserStore((state) => state.user);
  const userHearts = useUserStore((state) => state.user?.hearts || 5); // Added specific heart accessors
  const heartsNextRefill = useUserStore((state) => state.heartsNextRefill);

  // Create a stats object from user data
  const userStats = {
    level: userData?.level || 1,
    xp: userData?.xp || 0,
    progress: userData?.progress || 0,
    coins: userData?.coins || 0,
    hearts: userData?.hearts || 0,
  };

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.get<ApiUserResponse>("/users");
      const heartsData = await api.get<HeartsApiResponse>("/hearts");

      if (result.success && result.data && heartsData.data) {
        setHeartsNextRefill(heartsData.data.data.hearts_next_refill);

        // Get raw data first
        const rawData = result.data.users;
        const totalXp = rawData.xp || 0;

        console.log("Total XP:", rawData.battlepass);

        // Calculate level and remaining XP
        const level = Math.floor(totalXp / 300) + 1;
        const remainingXp = totalXp % 300;

        const xpProgress = (remainingXp / 300) * 100;

        console.log("Level:", level);
        console.log("Remaining XP:", remainingXp);

        // Create merged data with proper XP calculation
        const mergedData = {
          ...rawData,
          level: level, // Store calculated level
          xp: remainingXp, // Store only the remainder XP
          totalXp: totalXp, // Keep original total XP for reference
          hearts: heartsData.data.data.hearts,
          progress: xpProgress, // Store progress as a percentage
        };

        // Create a properly typed ApiUserResponse object
        const apiResponse: ApiUserResponse = {
          users: mergedData,
          languages: result.data.languages,
          message: result.data.message,
        };

        // Now pass the correctly typed object
        setUserDataFromApi(apiResponse);
      } else {
        setError(result.error?.message || "Failed to fetch user data");
        console.error("Error fetching user data:", result.error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setUserDataFromApi, setHeartsNextRefill]); // Added setHeartsNextRefill to dependencies

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const refreshUserData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchUserData()
      .catch((err) => {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Error refreshing user data:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [fetchUserData]);

  return {
    isLoading,
    error,
    userStats,
    userData,
    userHearts, // Added userHearts
    heartsNextRefill, // Added heartsNextRefill
    refreshUserData,
  };
};
