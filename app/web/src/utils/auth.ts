import axios from "axios";
import { APP_STAGE, BACKEND_AUTH_API } from "./common";
import { NavigateFunction } from "react-router-dom";

export const handleLogin = async (
  email: string,
  password: string,
  navigate: NavigateFunction,
  auth: AuthContextType | undefined
) => {
  try {
    const { data, status } = await axios.post(
      `${BACKEND_AUTH_API}/${APP_STAGE}/login`,
      { email, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (status !== 200 || !auth) {
      throw new Error("Login failed");
    }

    const { access_token, refresh_token } = data;
    auth.saveTokensToCookies(access_token, refresh_token);

    navigate("/main-page", { replace: true });
  } catch (error) {
    console.error("Error during login:", error);
  }
};

export const handleRegister = async (
  email: string,
  password: string,
  confirmPassword: string,
  username: string,
  navigate: NavigateFunction,
  auth: AuthContextType | undefined
) => {
  try {
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const { data, status } = await axios.post(
      `${BACKEND_AUTH_API}/${APP_STAGE}/register`,
      { email, password, username },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (status !== 200 || !auth) {
      throw new Error("Register failed");
    }

    const { access_token, refresh_token } = data;
    auth.saveTokensToCookies(access_token, refresh_token);

    navigate("/main-page", { replace: true });
  } catch (error) {
    console.error("Error during login:", error);
  }
};
