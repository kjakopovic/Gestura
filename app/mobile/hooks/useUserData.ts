import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { ApiUserResponse, HeartsApiResponse } from "@/types/types";
import { useUserStore } from "@/store/useUserStore";

export const useUserData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setUserDataFromApi = useUserStore((state) => state.setUserDataFromApi);
  const setHeartsNextRefill = useUserStore(
    (state) => state.setHeartsNextRefill
  );
  const userData = useUserStore((state) => state.user);
  const userHearts = useUserStore((state) => state.user?.hearts || 5);
  const heartsNextRefill = useUserStore((state) => state.heartsNextRefill);

  // Create a stats object from user data
  const userStats = {
    level: userData?.level || 1,
    xp: userData?.xp || 0,
    progress:
      userData?.progress || Math.min(((userData?.xp || 0) / 100) * 100, 100),
    coins: userData?.coins || 0,
    hearts: userData?.hearts || 5,
  };

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.get<ApiUserResponse>("/users");
      const heartsData = await api.get<HeartsApiResponse>("/hearts");

      // Check if the API call was successful and data exists
      if (result.success && result.data && heartsData.data) {
        // Store hearts_next_refill in the global state
        setHeartsNextRefill(heartsData.data.data.hearts_next_refill);

        const mergedData = {
          ...result.data,
          hearts: heartsData.data.data.hearts,
        };
        setUserDataFromApi(mergedData);
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
  }, [setUserDataFromApi, setHeartsNextRefill]);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    isLoading,
    error,
    userStats,
    userData,
    userHearts,
    heartsNextRefill,
    refreshUserData: fetchUserData,
  };
};
