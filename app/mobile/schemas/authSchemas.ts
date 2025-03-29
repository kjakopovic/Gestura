import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().nonempty("Email is required").email("Invalid email"),
  password: z.string().nonempty("Password is required"),
});

export const registerSchema = z
  .object({
    username: z.string().nonempty("Username is required"),
    email: z.string().nonempty("Email is required").email("Invalid email"),
    password: z.string().nonempty("Password is required"),
    confirmPassword: z.string().nonempty("Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const forgotEmailSchema = z.object({
  email: z.string().nonempty("Email is required").email("Invalid email"),
});

export const forgotCodeSchema = z.object({
  digit1: z.string().nonempty("Code is required"),
  digit2: z.string().nonempty("Code is required"),
  digit3: z.string().nonempty("Code is required"),
  digit4: z.string().nonempty("Code is required"),
  digit5: z.string().nonempty("Code is required"),
  digit6: z.string().nonempty("Code is required"),
});

export const forgotPasswordSchema = z
  .object({
    newPassword: z.string().nonempty("New password is required"),
    confirmNewPassword: z.string().nonempty("Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Passwords do not match",
  });
