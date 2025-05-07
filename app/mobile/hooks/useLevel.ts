import { useState, useCallback, useEffect } from "react";
import { LevelData } from "@/types/levels";
import * as icons from "@/constants/icons";
import { useUserData } from "@/hooks/useUserData";

export function useLevel() {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { userData } = useUserData();

  // Get the current level from userData
  const languageId = userData?.language_id || "usa";
  const currentUserLevel = userData?.current_level?.[languageId] || 1;

  // Function to determine level state based on current user level
  const getLevelState = (levelNumber: number) => {
    if (levelNumber < currentUserLevel) return "completed" as const;
    if (levelNumber === currentUserLevel) return "current" as const;
    return "locked" as const;
  };

  // Level templates (without state - we'll apply state dynamically)
  const levelTemplates: Omit<LevelData, "state">[] = [
    {
      id: 1,
      level: 1,
      type: "special",
      icon: icons.star1,
    },
    {
      id: 2,
      level: 2,
      type: "normal",
      icon: icons.star2,
    },
    {
      id: 3,
      level: 3,
      type: "special",
      icon: icons.star1,
    },
    {
      id: 4,
      level: 4,
      type: "normal",
      icon: icons.star2,
    },
    {
      id: 5,
      level: 5,
      type: "special",
      icon: icons.starTrophy,
    },
    {
      id: 6,
      level: 6,
      type: "special",
      icon: icons.starTrophy,
    },
    {
      id: 7,
      level: 7,
      type: "normal",
      icon: icons.star2,
    },
    {
      id: 8,
      level: 8,
      type: "normal",
      icon: icons.star2,
    },
    {
      id: 9,
      level: 9,
      type: "special",
      icon: icons.starTrophy,
    },
    {
      id: 10,
      level: 10,
      type: "normal",
      icon: icons.star2,
    },
  ];

  // Generate initial levels with proper states
  const generateInitialLevels = useCallback(() => {
    return levelTemplates.map((template) => ({
      ...template,
      state: getLevelState(template.level),
    }));
  }, [currentUserLevel]);

  const [levels, setLevels] = useState<LevelData[]>([]);

  // Update levels when user data changes
  useEffect(() => {
    setLevels(generateInitialLevels());
  }, [generateInitialLevels, currentUserLevel]);

  // Function to generate more levels
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
          const newLevel = newId;
          const templateIndex = index % 10; // Cycle through the pattern
          const templateLevel = levelTemplates[templateIndex];

          return {
            ...templateLevel,
            id: newId,
            level: newLevel,
            state: getLevelState(newLevel),
          };
        });

      setLevels([...newLevels, ...nextBatch]);
      setIsLoadingMore(false);
    }, 500);
  }, [levels, isLoadingMore, currentUserLevel]);

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
        level.id === levelId ? { ...level, state: "current" as const } : level
      )
    );
  }, []);

  // Function to complete a level
  const completeLevel = useCallback((levelId: number) => {
    setLevels((currentLevels) => {
      return currentLevels.map((level) => {
        if (level.id === levelId) {
          return { ...level, state: "completed" as const };
        }
        if (level.id === levelId + 1) {
          return { ...level, state: "current" as const };
        }
        return level;
      });
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
