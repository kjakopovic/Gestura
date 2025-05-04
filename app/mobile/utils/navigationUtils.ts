import { router } from "expo-router";

/**
 * Navigate to a specific level
 */
export const navigateToLevel = (levelId: number) => {
  router.push({
    pathname: "/level",
    params: { id: levelId.toString() },
  });
};

/**
 * Navigate to a specific settings page
 */
export const navigateToSetting = (type: "app" | "user", screen: string) => {
  router.push(`/settings/${type}-settings/${screen}`);
};

/**
 * Navigate to home screen
 */
export const navigateToHome = () => {
  router.push("/Home");
};
