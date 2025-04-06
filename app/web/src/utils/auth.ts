import axios from "axios";
import { APP_STAGE, BACKEND_AUTH_API } from "./common";
import { NavigateFunction } from "react-router-dom";
import { APP_ROUTES } from "@/constants/common";
import * as Yup from "yup";
import { LOGIN_SCHEMA, REGISTER_SCHEMA } from "@/constants/auth";

const validate = async (values: any, schema: Yup.ObjectSchema<any>) => {
  try {
    const validData = await schema.validate(values, { abortEarly: false });
    return { validData, errors: null };
  } catch (err: any) {
    const errors = err.inner.reduce((acc: any, error: any) => {
      acc[error.path] = error.message;
      return acc;
    }, {});
    return { validData: null, errors };
  }
};

export const handleLogin = async (
  email: string,
  password: string,
  navigate: NavigateFunction,
  auth: AuthContextType | undefined,
  setErrors: React.Dispatch<React.SetStateAction<string[]>>
) => {
  const { errors } = await validate({ email, password }, LOGIN_SCHEMA);
  if (errors) {
    setErrors((prev) => [...prev, ...Object.values(errors as string)]);
    return;
  }

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
      setErrors((prev) => [...prev, data.message || "Login failed"]);
      return;
    }

    const { access_token, refresh_token } = data;
    auth.saveTokensToCookies(access_token, refresh_token);

    navigate(APP_ROUTES.MAIN_PAGE, { replace: true });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      setErrors((prev) => [
        ...prev,
        error?.response?.data.message || "Register failed",
      ]);
    } else {
      setErrors((prev) => [...prev, `Error during register: ${error}`]);
    }
  }
};

export const handleRegister = async (
  email: string,
  password: string,
  confirmPassword: string,
  username: string,
  navigate: NavigateFunction,
  auth: AuthContextType | undefined,
  setErrors: React.Dispatch<React.SetStateAction<string[]>>
) => {
  const { errors } = await validate(
    { email, password, confirmPassword, username },
    REGISTER_SCHEMA
  );
  if (errors) {
    setErrors((prev) => [...prev, ...Object.values(errors as string)]);
    return;
  }

  try {
    if (password !== confirmPassword) {
      setErrors((prev) => [...prev, "Passwords do not match"]);
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
      setErrors((prev) => [...prev, data.message || "Register failed"]);
      return;
    }

    const { access_token, refresh_token } = data;
    auth.saveTokensToCookies(access_token, refresh_token);

    navigate(APP_ROUTES.MAIN_PAGE, { replace: true });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      setErrors((prev) => [
        ...prev,
        error?.response?.data.message || "Register failed",
      ]);
    } else {
      setErrors((prev) => [...prev, `Error during register: ${error}`]);
    }
  }
};
