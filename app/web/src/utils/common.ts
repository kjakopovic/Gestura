import { NavigateFunction } from "react-router-dom";

export const redirectToLogin = (navigate: NavigateFunction) => {
  navigate("/login");
};

export const redirectToBuy = (navigate: NavigateFunction) => {
  navigate("/buy");
};

export const redirectToGoogleStore = () => {
  window.open("https://play.google.com/store/apps", "_blank");
};

export const redirectToAppleStore = () => {
  window.open("https://apps.apple.com", "_blank");
};

export const redirectToOtherPage = (
  path: string,
  navigate?: NavigateFunction
) => {
  if (navigate) {
    navigate(path);
  }
};
