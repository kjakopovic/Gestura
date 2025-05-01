import * as z from "zod";
import { TextInputProps } from "react-native";

import { loginSchema } from "@/schemas/authSchemas";
import { registerSchema } from "@/schemas/authSchemas";
import { forgotEmailSchema } from "@/schemas/authSchemas";
import { forgotCodeSchema } from "@/schemas/authSchemas";
import { forgotPasswordSchema } from "@/schemas/authSchemas";

export type LoginFormData = z.infer<typeof loginSchema>;

export type RegisterFormData = z.infer<typeof registerSchema>;

export type ForgotEmailFormData = z.infer<typeof forgotEmailSchema>;

export type ForgotCodeFormData = z.infer<typeof forgotCodeSchema>;

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export type CustomInputProps = TextInputProps & {
  value: string;
  icon?: any;
  placeholder: string;
  onChangeText: (text: string) => void;
  className?: string;
};

// Types for the forgot password functions
export type ForgotEmailResult = {
  success: boolean;
  error?: { message: string };
};

export type ForgotCodeResult = {
  success: boolean;
  error?: { message: string };
};

export type ForgotPasswordResult = {
  success: boolean;
  error?: { message: string };
};
