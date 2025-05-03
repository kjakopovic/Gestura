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

// User data type
export interface UserData {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  level: number;
  xp: number;
  progress?: number; // Progress percentage (0-100)
  coins: number;
  hearts: number;
  subscription?: number;
  current_level?: number;
  battlepass_xp?: number;
  hearts_next_refill?: string | null;
  time_played?: number;
  task_level?: number;
  phone_numer?: string | null;
  letters_learned?: Record<string, any>;
  items_inventory?: any[];
  // User preferences
  sound_effects?: boolean;
  haptic_feedback?: boolean;
  push_notifications?: boolean;
  daily_reminder?: boolean;
  heart_refill?: boolean;
  [key: string]: any; // For flexibility with API responses
}

export interface LanguageData {
  id: string;
  name: string;
  image_url: string;
}

export interface ApiUserResponse {
  users: UserData;
  languages: LanguageData[];
  message: string;
}
