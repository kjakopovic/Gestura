import { useState } from "react";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { ClickableLogo, Input } from "@/components/elements";
import { useNavigate } from "react-router-dom";
import {
  Button,
  ButtonType,
  ErrorMessage,
  Typography,
  TypographyType,
} from "@/components/common";
import { AuthFooter } from "@/components/auth";
import { handleRegister } from "@/utils/auth";
import { useAuth } from "@/hooks/useAuth";
import { APP_ROUTES } from "@/constants/common";

const SignUp = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [user, setUser] = useState<{
    email: string;
    username: string;
    password: string;
    confirm_password: string;
  }>({
    email: "",
    username: "",
    password: "",
    confirm_password: "",
  });

  return (
    <div className="min-h-screen flex flex-col items-center relative w-full">
      <div className="flex flex-row items-start justify-between w-full p-5 z-10">
        <ClickableLogo
          onClick={() => {
            navigate("/");
          }}
        />
      </div>

      {errors.length > 0 && (
        <div className="flex flex-col items-center justify-center h-full w-full z-10">
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
            text="Sign Up"
            styles="text-3xl text-background-100"
          />
          <p className="text-lg gestura-text-landing-title text-background-100 my-4">
            If you already have an account, <br />
            You can{" "}
            <a
              href={APP_ROUTES.LOGIN}
              className="text-primary gestura-text-landing-title"
            >
              Log in here!
            </a>
          </p>
        </div>

        <div className="flex flex-col items-start w-full justify-center mt-4">
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
            className="w-full"
            type="text"
            label="Username"
            icon={icons.person}
            iconAlt="White username icon, little person icon man"
            placeholder="Enter a username"
            value={user.username}
            onChange={(e) =>
              setUser((prev) => ({ ...prev, username: e.target.value }))
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
          <Input
            className="w-full mb-4"
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm Password"
            icon={icons.lock}
            iconAlt="White password icon, little locked lock"
            placeholder="Confirm your password"
            value={user.confirm_password}
            onChange={(e) =>
              setUser((prev) => ({ ...prev, confirm_password: e.target.value }))
            }
            rightIcon={showConfirmPassword ? icons.eyeCross : icons.eye}
            rightIconAlt={
              showConfirmPassword ? "White, crossed eye icon" : "White eye icon"
            }
            onRightIconClick={() => setShowConfirmPassword((prev) => !prev)}
          />

          <Button
            type={ButtonType.SECONDARY_OUTLINE}
            text="Register"
            styles="w-full rounded-full p-3 mt-4"
            onClick={() => {
              handleRegister(
                user.email,
                user.password,
                user.confirm_password,
                user.username,
                navigate,
                auth,
                setErrors
              );
            }}
          />
        </div>

        <AuthFooter label="Or sign up with" />
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

export default SignUp;
