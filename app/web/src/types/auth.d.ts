export {};

global {
  interface AuthState {
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
  }

  interface AuthContextType {
    authState: AuthState;
    setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
    loadTokensFromCookies: () => void;
    saveTokensToCookies: (jwtToken: string, refreshToken: string) => void;
    removeTokensFromCookies: () => void;
    loading: boolean;
  }
}
