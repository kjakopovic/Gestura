import { getAccessToken, getRefreshToken, saveTokens } from "./auth";

const API_BASE_URL = process.env.EXPO_PUBLIC_USER_API_BASE_URL;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    status?: number;
  };
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

/**
 * Main API call function that handles token management and common error handling
 */
export async function apiCall<T = any>(
  endpoint: string,
  method: HttpMethod = "GET",
  options: RequestOptions = { requireAuth: true }
): Promise<ApiResponse<T>> {
  try {
    // Build the full URL
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL}${
          endpoint.startsWith("/") ? endpoint : `/${endpoint}`
        }`;

    // Setup headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add authorization token if needed
    const token = await getAccessToken();
    const refreshToken = await getRefreshToken();
    if (!token) {
      return {
        success: false,
        error: { message: "No access token found. Please log in." },
      };
    }

    const authHeader = `Bearer ${token}`;
    headers["Authorization"] = authHeader;

    if (refreshToken) {
      headers["x-refresh-token"] = refreshToken;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    // Add body if it exists (for POST, PUT, etc.)
    if (options.body && method !== "GET") {
      requestOptions.body = JSON.stringify(options.body);
    }

    // Make the request
    const response = await fetch(url, requestOptions);

    // Check for new JWT token in headers
    const newToken =
      response.headers.get("Authorization") ||
      response.headers.get("X-New-Token");

    if (newToken) {
      const tokenValue = newToken.startsWith("Bearer ")
        ? newToken.substring(7)
        : newToken;

      // Get the current refresh token
      const refreshToken = await getRefreshToken();

      // Save the new access token along with the existing refresh token
      if (refreshToken) {
        await saveTokens(tokenValue, refreshToken);
      }
    }

    // Parse the response
    let data;
    const contentType = response.headers.get("Content-Type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return success or error based on response status
    if (response.ok) {
      return {
        success: true,
        data,
      };
    } else {
      return {
        success: false,
        error: {
          message: data.error || "Something went wrong",
          status: response.status,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
    };
  }
}

// Helper methods for common HTTP methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiCall<T>(endpoint, "GET", options),

  post: <T>(endpoint: string, body: any, options?: RequestOptions) =>
    apiCall<T>(endpoint, "POST", { ...options, body }),

  put: <T>(endpoint: string, body: any, options?: RequestOptions) =>
    apiCall<T>(endpoint, "PUT", { ...options, body }),

  patch: <T>(endpoint: string, body: any, options?: RequestOptions) =>
    apiCall<T>(endpoint, "PATCH", { ...options, body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiCall<T>(endpoint, "DELETE", options),
};
