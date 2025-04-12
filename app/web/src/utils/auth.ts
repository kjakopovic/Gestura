import axios from "axios";
import { APP_STAGE, BACKEND_AUTH_API } from "./common";
import { NavigateFunction } from "react-router-dom";
import { APP_ROUTES, HelperFunctionResponse } from "@/constants/common";
import * as Yup from "yup";
import {
  FORGOT_PASS_CHANGE_SCHEMA,
  FORGOT_PASS_REQUEST_SCHEMA,
  FORGOT_PASS_VALIDATE_SCHEMA,
  LOGIN_SCHEMA,
  REGISTER_SCHEMA,
} from "@/constants/validation";

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
        error?.response?.data.message || "Login failed",
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
      return;
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

export const handleForgotPasswordRequest = async (
  email: string,
  setErrors: React.Dispatch<React.SetStateAction<string[]>>
): Promise<HelperFunctionResponse> => {
  const { errors } = await validate({ email }, FORGOT_PASS_REQUEST_SCHEMA);
  if (errors) {
    setErrors((prev) => [...prev, ...Object.values(errors as string)]);
    return HelperFunctionResponse.ERROR;
  }

  try {
    const { data, status } = await axios.post(
      `${BACKEND_AUTH_API}/${APP_STAGE}/forgot-password/request`,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (status !== 200) {
      setErrors((prev) => [
        ...prev,
        data.message || "We couldn't send you recovery code, please try again",
      ]);
      return HelperFunctionResponse.ERROR;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      setErrors((prev) => [
        ...prev,
        error?.response?.data.message ||
          "We couldn't send you recovery code, please try again",
      ]);
    } else {
      setErrors((prev) => [
        ...prev,
        `Error during forgot password request: ${error}`,
      ]);
    }

    return HelperFunctionResponse.ERROR;
  }

  return HelperFunctionResponse.SUCCESS;
};

export const handleForgotPasswordValidate = async (
  email: string,
  code: string,
  setErrors: React.Dispatch<React.SetStateAction<string[]>>
): Promise<HelperFunctionResponse> => {
  const { errors } = await validate(
    { email, code },
    FORGOT_PASS_VALIDATE_SCHEMA
  );
  if (errors) {
    setErrors((prev) => [...prev, ...Object.values(errors as string)]);
    return HelperFunctionResponse.ERROR;
  }

  try {
    const { data, status } = await axios.post(
      `${BACKEND_AUTH_API}/${APP_STAGE}/forgot-password/validate`,
      { email, code },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (status !== 200) {
      console.log("status is not 200", status);
      setErrors((prev) => [
        ...prev,
        data.message || "Code you entered is invalid",
      ]);
      return HelperFunctionResponse.ERROR;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      setErrors((prev) => [
        ...prev,
        error?.response?.data.message || "Code you entered is invalid",
      ]);
    } else {
      setErrors((prev) => [
        ...prev,
        `Error during forgot password validate: ${error}`,
      ]);
    }
    return HelperFunctionResponse.ERROR;
  }

  return HelperFunctionResponse.SUCCESS;
};

export const handlePasswordChange = async (
  email: string,
  code: string,
  password: string,
  setErrors: React.Dispatch<React.SetStateAction<string[]>>
): Promise<HelperFunctionResponse> => {
  const { errors } = await validate(
    { email, code, password },
    FORGOT_PASS_CHANGE_SCHEMA
  );
  if (errors) {
    setErrors((prev) => [...prev, ...Object.values(errors as string)]);
    return HelperFunctionResponse.ERROR;
  }

  try {
    const { data, status } = await axios.post(
      `${BACKEND_AUTH_API}/${APP_STAGE}/forgot-password/reset`,
      { email, code, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (status !== 200) {
      setErrors((prev) => [...prev, data.message || "Password is invalid"]);
      return HelperFunctionResponse.ERROR;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      setErrors((prev) => [
        ...prev,
        error?.response?.data.message || "Password is invalid",
      ]);
    } else {
      setErrors((prev) => [...prev, `Error during password change: ${error}`]);
    }

    return HelperFunctionResponse.ERROR;
  }

  return HelperFunctionResponse.SUCCESS;
};
