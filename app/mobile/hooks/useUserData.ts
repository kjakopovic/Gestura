import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { ApiUserResponse } from "@/types/types";
import { useUserStore } from "@/store/useUserStore";

export const useUserData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setUserDataFromApi = useUserStore((state) => state.setUserDataFromApi);
  const userData = useUserStore((state) => state.user);

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

      if (result.success && result.data) {
        setUserDataFromApi(result.data);
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
  }, [setUserDataFromApi]);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    isLoading,
    error,
    userStats,
    userData,
    refreshUserData: fetchUserData,
  };
};
