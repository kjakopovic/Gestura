import { useState } from "react";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ClickableLogo, Input } from "@/components/elements";
import {
  Button,
  ButtonType,
  ErrorMessage,
  Typography,
  TypographyType,
} from "@/components/common";
import { AuthFooter } from "@/components/auth";
import { handleLogin } from "@/utils/auth";
import { APP_ROUTES } from "@/constants/common";

const Login = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<{ email: string; password: string }>({
    email: "",
    password: "",
  });

  return (
    <div className="min-h-screen flex flex-col items-center relative w-full">
      <div className="flex flex-row items-start justify-between w-full p-5 z-10">
        <ClickableLogo
          onClick={() => {
            navigate(APP_ROUTES.LANDING_PAGE);
          }}
        />
      </div>

      {errors.length > 0 && (
        <div className="flex flex-col items-center justify-center h-full w-[50vw] z-10 gap-2 mb-10">
          {errors.map((error, index) => (
            <ErrorMessage
              key={index}
              message={error}
              onClick={() => {
                setErrors((prev) => prev.filter((_, i) => i !== index));
              }}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col items-center justify-center h-full w-1/2 md:w-1/4 sm:w-1/3 z-10">
        <div className="flex flex-col items-start w-full justify-center">
          <Typography
            type={TypographyType.H1}
            text="Sign in"
            styles="text-3xl text-background-100"
          />
          <p className="text-lg gestura-text-landing-title text-background-100 my-4">
            If you don't have an account, <br />
            You can{" "}
            <a
              href={APP_ROUTES.SIGNUP}
              className="text-primary gestura-text-landing-title"
            >
              Register here!
            </a>
          </p>
        </div>

        <div className="flex flex-col items-start w-full justify-center">
          <Input
            className="w-full"
            type="text"
            label="Email"
            icon={icons.envelope}
            iconAlt="White email icon, little envelope"
            placeholder="Enter your email address"
            value={user.email}
            onChange={(e) =>
              setUser((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <Input
            className="w-full mb-4"
            type={showPassword ? "text" : "password"}
            label="Password"
            icon={icons.lock}
            iconAlt="White password icon, little locked lock"
            placeholder="Enter your password"
            value={user.password}
            onChange={(e) =>
              setUser((prev) => ({ ...prev, password: e.target.value }))
            }
            rightIcon={showPassword ? icons.eyeCross : icons.eye}
            rightIconAlt={
              showPassword ? "White, crossed eye icon" : "White eye icon"
            }
            onRightIconClick={() => setShowPassword((prev) => !prev)}
          />
          <div className="flex flex-row items-center justify-between w-full mt-1">
            <div className="flex flex-row items-center">
              <input type="checkbox" className="h-4 w-4" />
              <p className="text-background-300 font-light text-xs ml-2 gestura-text-landing-title">
                Remember me
              </p>
            </div>
            <a
              href={APP_ROUTES.FORGOT_PASSWORD}
              className="text-primary font-light text-xs mt-2 gestura-text-landing-title"
            >
              Forgot password?
            </a>
          </div>
          <Button
            type={ButtonType.SECONDARY_OUTLINE}
            text="Login"
            styles="w-full rounded-full p-3 mt-4"
            onClick={() => {
              handleLogin(user.email, user.password, navigate, auth, setErrors);
            }}
          />
        </div>
        <AuthFooter label="Or sign in with" />
      </div>

      {/* Background Image */}
      <img
        src={images.bgImage}
        alt="Background image"
        className="absolute z-0 object-cover w-full h-full"
      />
    </div>
  );
};

export default Login;
