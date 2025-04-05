import { REFRESH_TOKEN_COOKIE_NAME, TOKEN_COOKIE_NAME } from "@/constants/auth";
import { createContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: any) => {
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    refreshToken: null,
    isAuthenticated: false,
  });

  const loadTokensFromCookies = () => {
    const token = Cookies.get(TOKEN_COOKIE_NAME);
    const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE_NAME);

    if (token && refreshToken) {
      setAuthState({
        token,
        refreshToken,
        isAuthenticated: true,
      });
    } else {
      setAuthState({
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    }
  };

  const saveTokensToCookies = (token: string, refreshToken: string) => {
    Cookies.set(TOKEN_COOKIE_NAME, token, { path: "/", sameSite: "strict" });
    Cookies.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      path: "/",
      sameSite: "strict",
    });

    setAuthState({
      token,
      refreshToken,
      isAuthenticated: true,
    });
  };

  const removeTokensFromCookies = () => {
    Cookies.remove(TOKEN_COOKIE_NAME, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_COOKIE_NAME, { path: "/" });

    setAuthState({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  };

  useEffect(() => {
    loadTokensFromCookies();
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authState,
        setAuthState,
        loadTokensFromCookies,
        saveTokensToCookies,
        removeTokensFromCookies,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
