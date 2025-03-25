import { useState } from "react";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

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
        <form className="flex flex-col items-start w-full justify-center mt-4">
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

          <button className="w-full py-2 mt-4 justify-center text-background-100 font-medium text-lg bg-background-600 border border-background-400 rounded-full hover:cursor-pointer hover:bg-background-500">
            Login
          </button>
        </form>
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
