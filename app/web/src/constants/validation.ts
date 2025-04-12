import * as Yup from "yup";

const EMAIL_VALIDATION = Yup.string()
  .email("Invalid email address")
  .required("Email is required");

const PASSWORD_VALIDATION = Yup.string()
  .min(7, "Password must be at least 7 characters")
  .required("Password is required");

const SIX_DIGIT_CODE_VALIDATION = Yup.string()
  .length(6, "Code must be 6 characters")
  .matches(/^\d+$/, "Code must only contain digits")
  .required("Code is required");

const USERNAME_VALIDATION = Yup.string().required("Username is required");

export const LOGIN_SCHEMA = Yup.object().shape({
  email: EMAIL_VALIDATION,
  password: PASSWORD_VALIDATION,
});

export const REGISTER_SCHEMA = Yup.object().shape({
  email: EMAIL_VALIDATION,
  username: USERNAME_VALIDATION,
  password: PASSWORD_VALIDATION,
  confirmPassword: PASSWORD_VALIDATION,
});

export const FORGOT_PASS_REQUEST_SCHEMA = Yup.object().shape({
  email: EMAIL_VALIDATION,
});

export const FORGOT_PASS_VALIDATE_SCHEMA = Yup.object().shape({
  email: EMAIL_VALIDATION,
  code: SIX_DIGIT_CODE_VALIDATION,
});

export const FORGOT_PASS_CHANGE_SCHEMA = Yup.object().shape({
  email: EMAIL_VALIDATION,
  code: SIX_DIGIT_CODE_VALIDATION,
  password: PASSWORD_VALIDATION,
});
