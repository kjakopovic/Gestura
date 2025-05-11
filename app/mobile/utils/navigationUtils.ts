import { router } from "expo-router";

/**
 * Navigate to the home screen
 */
export const navigateToHome = () => {
  router.replace("/(root)/(tabs)/Home");
};

/**
 * Navigate to a level
 * @param levelId Optional level ID
 */
export const navigateToLevel = (levelId?: number, language_id?: string) => {
  router.push({
    pathname: "/(root)/level",
    params:
      levelId && language_id
        ? { id: levelId, language: language_id }
        : undefined,
  });
};

/**
 * Navigate to a settings screen
 * @param settingType Type of setting (app or user)
 * @param screenName Name of the screen
 */
export const navigateToSetting = (
  settingType: "app" | "user",
  screenName: string
) => {
  router.push(
    //@ts-ignore
    `/(root)/(profile-options)/settings/${settingType}-settings/${screenName}`
  );
};

/**
 * Navigate back to the previous screen
 */
export const navigateBack = () => {
  router.back();
};
