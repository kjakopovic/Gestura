import { Typography, TypographyType } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LoginCallback = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const token = urlParams.get("token");
    const refreshToken = urlParams.get("refresh_token");

    if (token && refreshToken && auth) {
      auth.saveTokensToCookies(token, refreshToken);
    }

    navigate("/main-page");
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Typography
        text="Processing authentication"
        type={TypographyType.LANDING_TITLE}
        styles="text-white"
      />
    </div>
  );
};

export default LoginCallback;
