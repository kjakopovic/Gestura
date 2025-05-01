import { useState, useCallback } from "react";
import { LevelData } from "@/types/levels";
import * as icons from "@/constants/icons";

export function useLevel() {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Initial 10 levels
  const initialLevels: LevelData[] = [
    {
      id: 1,
      level: 1,
      type: "special",
      state: "unlocked",
      icon: icons.star1,
    },
    {
      id: 2,
      level: 2,
      type: "normal",
      state: "unlocked",
      icon: icons.star2,
    },
    {
      id: 3,
      level: 3,
      type: "special",
      state: "unlocked",
      icon: icons.star1,
    },
    {
      id: 4,
      level: 4,
      type: "normal",
      state: "locked",
      icon: icons.star2,
    },
    {
      id: 5,
      level: 5,
      type: "special",
      state: "locked",
      icon: icons.starTrophy,
    },
    {
      id: 6,
      level: 6,
      type: "special",
      state: "locked",
      icon: icons.starTrophy,
    },
    {
      id: 7,
      level: 7,
      type: "normal",
      state: "locked",
      icon: icons.star2,
    },
    {
      id: 8,
      level: 8,
      type: "normal",
      state: "locked",
      icon: icons.star2,
    },
    {
      id: 9,
      level: 9,
      type: "special",
      state: "locked",
      icon: icons.starTrophy,
    },
    {
      id: 10,
      level: 10,
      type: "normal",
      state: "locked",
      icon: icons.star2,
    },
  ];

  const [levels, setLevels] = useState<LevelData[]>(initialLevels);

  // Function to generate more levels by cycling through the pattern
  const loadMoreLevels = useCallback(() => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);

    // Create a delay to simulate loading
    setTimeout(() => {
      const newLevels = [...levels];
      const nextBatch = Array(10)
        .fill(0)
        .map((_, index) => {
          const currentLength = newLevels.length;
          const newId = currentLength + index + 1;
          const templateIndex = index % 10; // Cycle through the pattern
          const templateLevel = initialLevels[templateIndex];

          return {
            ...templateLevel,
            id: newId,
            level: newId,
            state: "locked" as const,
          };
        });

      setLevels([...newLevels, ...nextBatch]);
      setIsLoadingMore(false);
    }, 500);
  }, [levels, isLoadingMore]);

  // Function to handle scroll end for infinite loading
  const handleScrollToEnd = useCallback(() => {
    if (!isLoadingMore) {
      loadMoreLevels();
    }
  }, [loadMoreLevels, isLoadingMore]);

  // Function to unlock a level
  const unlockLevel = useCallback((levelId: number) => {
    setLevels((currentLevels) =>
      currentLevels.map((level) =>
        level.id === levelId ? { ...level, state: "unlocked" as const } : level
      )
    );
  }, []);

  // Function to complete a level
  const completeLevel = useCallback((levelId: number) => {
    setLevels((currentLevels) => {
      const updatedLevels = currentLevels.map((level) => {
        if (level.id === levelId) {
          return { ...level, state: "completed" as const };
        }
        // Unlock the next level if it exists and is currently locked
        if (level.id === levelId + 1 && level.state === "locked") {
          return { ...level, state: "unlocked" as const };
        }
        return level;
      });
      return updatedLevels;
    });
  }, []);

  return {
    levels,
    isLoadingMore,
    loadMoreLevels,
    handleScrollToEnd,
    unlockLevel,
    completeLevel,
  };
}
