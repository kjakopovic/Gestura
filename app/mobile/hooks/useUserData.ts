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
    level:
      typeof userData?.xp === "number" ? Math.floor(userData.xp / 300) + 1 : 1,
    xp: typeof userData?.xp === "number" ? userData.xp % 300 : 0,
    progress:
      userData?.progress ||
      Math.min(
        ((typeof userData?.xp === "number" ? userData.xp : 0) / 100) * 100,
        100
      ),
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

        const mergedData = {
          ...result.data,
          hearts: heartsData.data.data.hearts, // Merge heart data with user data
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
