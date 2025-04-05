import * as Yup from "yup";

export const TOKEN_COOKIE_NAME = "token";
export const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
export const GOOGLE_TYPE_OF_SERVICE = "google";

export const LOGIN_SCHEMA = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(7, "Password must be at least 7 characters")
    .required("Password is required"),
});

export const REGISTER_SCHEMA = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  username: Yup.string().required("Username is required"),
  password: Yup.string()
    .min(7, "Password must be at least 7 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .min(7, "Password must be at least 7 characters")
    .required("Password is required"),
});
