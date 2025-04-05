import axios from "axios";
import { NavigateFunction } from "react-router-dom";

const BACKEND_AUTH_API = import.meta.env.VITE_BACKEND_AUTH_API || "";

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

export const handleThirdPartyLogin = async (type_of_service: string) => {
  console.log("type_of_service", type_of_service);
  console.log("BACKEND_AUTH_API", BACKEND_AUTH_API);
  await axios.get(
    `${BACKEND_AUTH_API}/auth/login/third-party?type_of_service=${type_of_service}&platform=web`
  );
};
