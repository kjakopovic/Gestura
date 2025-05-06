import { Router } from "expo-router";

/**
 * Navigate to a specific level
 */
export const navigateToLevel = (levelId: number, router: Router) => {
  router.push({
    pathname: "/level",
    params: { id: levelId.toString() },
  });
};

/**
 * Navigate to a specific settings page
 */
export const navigateToSetting = (
  type: "app" | "user",
  screen: string,
  router: Router
) => {
  router.push(`/settings/${type}-settings/${screen}`);
};

/**
 * Navigate to home screen
 */
export const navigateToHome = (router: Router) => {
  router.push("/(root)/(tabs)/Home");
};
