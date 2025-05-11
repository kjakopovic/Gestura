import * as SecureStore from "expo-secure-store";

import {
  LoginFormData,
  RegisterFormData,
  ForgotCodeResult,
  ForgotEmailResult,
  ForgotPasswordResult,
} from "@/types/types";

const URL_BASE = process.env.EXPO_PUBLIC_USER_API_BASE_URL;

// Token storage keys
const ACCESS_TOKEN_KEY = "gestura_access_token";
const REFRESH_TOKEN_KEY = "gestura_refresh_token";

// Save tokens to secure storage
export async function saveTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

// Get tokens from secure storage
export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

// Remove tokens (logout)
export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

// Check if user is logged in
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

// Login function
export async function login(data: LoginFormData): Promise<any> {
  try {
    const response = await fetch(`${URL_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const json = await response.json();

    if (response.ok) {
      // Save tokens if they exist in the response
      if (json.access_token && json.refresh_token) {
        await saveTokens(json.access_token, json.refresh_token);
      }
      return { success: true, data: json };
    } else {
      return { success: false, error: json };
    }
  } catch (error) {
    console.error("Error during login:", error);
    return { success: false, error };
  }
}

// Register function
export async function register(data: RegisterFormData): Promise<any> {
  try {
    const response = await fetch(`${URL_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        password: data.password,
      }),
    });

    const json = await response.json();

    if (response.ok) {
      // Save tokens if they exist in the response
      if (json.access_token && json.refresh_token) {
        await saveTokens(json.access_token, json.refresh_token);
      }
      return { success: true, data: json };
    } else {
      return { success: false, error: json };
    }
  } catch (error) {
    console.error("Error during registration:", error);
    return { success: false, error };
  }
}

// Logout function
export async function logout(): Promise<void> {
  await clearTokens();
}

/**
 * Sends a password reset email to the provided email address
 */
export const requestPasswordReset = async (data: {
  email: string;
}): Promise<ForgotEmailResult> => {
  try {
    // Here you would make an API call to your backend
    // to request a password reset email
    const response = await fetch(`${URL_BASE}/forgot-password/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: data.email }),
    });
    const json = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: { message: json.error || "Failed to send reset email." },
      };
    }
    // For now, return success
    return { success: true };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return {
      success: false,
      error: { message: "Failed to send reset email. Please try again." },
    };
  }
};

/**
 * Verifies the reset code entered by the user
 */
export const verifyResetCode = async (
  data: {
    digit1: string;
    digit2: string;
    digit3: string;
    digit4: string;
    digit5: string;
    digit6: string;
  },
  email: string
): Promise<ForgotCodeResult> => {
  try {
    // Combine digits into a code string
    const code =
      data.digit1 +
      data.digit2 +
      data.digit3 +
      data.digit4 +
      data.digit5 +
      data.digit6;

    // Here you would make an API call to your backend
    // to verify the reset code for the specific email
    const response = await fetch(`${URL_BASE}/forgot-password/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, email }),
    });
    const json = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: { message: json.error || "Failed to verify code." },
      };
    }
    // For now, return success
    return { success: true };
  } catch (error) {
    console.error("Error verifying reset code:", error);
    return {
      success: false,
      error: { message: "Failed to verify code. Please try again." },
    };
  }
};

/**
 * Resets the user's password with the new password
 */
export const resetPassword = async (
  data: {
    newPassword: string;
    confirmNewPassword: string;
  },
  email: string,
  code: string
): Promise<ForgotPasswordResult> => {
  try {
    // Removed logging of the new password to prevent exposure of sensitive information.

    // Here you would make an API call to your backend
    // to reset the password
    const response = await fetch(`${URL_BASE}/forgot-password/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: data.newPassword,
        email,
        code,
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: { message: json.error || "Failed to reset password." },
      };
    }
    // For now, return success
    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      error: { message: "Failed to reset password. Please try again." },
    };
  }
};
