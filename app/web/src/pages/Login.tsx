import { useState } from "react";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import {
  APP_STAGE,
  BACKEND_AUTH_API,
  handleThirdPartyLogin,
} from "@/utils/common";
import { GOOGLE_TYPE_OF_SERVICE } from "@/constants/auth";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<{ email: string; password: string }>({
    email: "",
    password: "",
  });

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data, status } = await axios.post(
        `${BACKEND_AUTH_API}/${APP_STAGE}/login`,
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (status !== 200 || !auth) {
        throw new Error("Login failed");
      }

      const { access_token, refresh_token } = data;
      auth.saveTokensToCookies(access_token, refresh_token);

      navigate("/main-page", { replace: true });
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center relative w-full">
      <img
        src={images.bgImage}
        alt="Background image"
        className="absolute z-0 object-cover w-full h-full"
      />
      <div className="flex flex-row items-start justify-between w-full p-5 z-10">
        <img src={icons.logoText} alt="Logo" className="w-60" />
      </div>
      <div className="flex flex-col items-center justify-center h-full w-1/2 md:w-1/4 sm:w-1/3 z-10">
        <div className="flex flex-col items-start w-full justify-center">
          <h1 className="text-3xl font-medium text-background-100">Sign in</h1>
          <p className="text-lg text-background-100 my-4">
            If you don't have an account, <br />
            You can{" "}
            <a href="/signup" className="text-primary">
              Register here!
            </a>
          </p>
        </div>
        <div className="flex flex-col items-start w-full justify-center mt-4">
          <p className="text-background-300 text-sm font-medium">Email</p>
          <div className="relative w-full">
            <img
              src={icons.envelope}
              alt="Email Icon"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            />
            <input
              type="email"
              placeholder="Enter your email address"
              onChange={(e) =>
                setUser((prev) => ({ ...prev, email: e.target.value }))
              }
              value={user.email}
              className="w-full h-10 pl-10 p-4 text-background-100 border-b border-background-300 focus:ring-0 focus:outline-none focus:border-b-2 focus:border-background-100"
            />
          </div>
          <p className="text-background-300 mt-4 text-sm font-medium">
            Password
          </p>
          <div className="relative w-full">
            <img
              src={icons.lock}
              alt="Password Icon"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              onChange={(e) =>
                setUser((prev) => ({ ...prev, password: e.target.value }))
              }
              value={user.password}
              className="w-full h-10 pl-10 pr-10 p-4 text-background-100 border-b border-background-300 focus:ring-0 focus:outline-none focus:border-b-2 focus:border-background-100"
            />
            <img
              src={showPassword ? icons.eyeCross : icons.eyeCross}
              alt="Toggle Password Visibility"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            />
          </div>
          <div className="flex flex-row items-center justify-between w-full mt-1">
            <div className="flex flex-row items-center">
              <input type="checkbox" className="h-4 w-4" />
              <p className="text-background-300 font-light text-xs ml-2">
                Remember me
              </p>
            </div>
            <a
              href="/forgot-password"
              className="text-primary font-light text-xs mt-2"
            >
              Forgot password?
            </a>
          </div>

          <button
            className="w-full py-2 mt-4 justify-center text-background-100 font-medium text-lg bg-background-600 border border-background-400 rounded-full hover:cursor-pointer hover:bg-background-500"
            onClick={() => {
              handleLogin(user.email, user.password);
            }}
            disabled={!user.email || !user.password}
          >
            Login
          </button>
        </div>
        <div className="flex flex-col items-center justify-center w-full mt-12">
          <p className="text-background-300">Or sign in with</p>
          <div className="flex flex-row items-center justify-center w-full gap-x-4 mt-2">
            <img
              src={icons.facebook}
              alt="Facebook Icon"
              className="w-10 h-10 cursor-pointer"
            />
            <img
              src={icons.apple}
              alt="Apple Icon"
              className="w-8 h-8 cursor-pointer"
            />
            <img
              src={icons.google}
              alt="Google Icon"
              className="w-8 h-8 cursor-pointer"
              onClick={() => handleThirdPartyLogin(GOOGLE_TYPE_OF_SERVICE)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
