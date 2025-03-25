import { useState, useRef } from "react";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

const ForgotPassword = () => {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputRefs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement>(null)
  );

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-start w-full justify-center">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 pl-10 p-4 text-background-100 border-b border-background-300 focus:ring-0 focus:outline-none focus:border-b-2 focus:border-background-100"
              />
            </div>
            <button
              className="w-full py-2 mt-4 text-background-100 font-medium text-lg bg-background-600 border border-background-400 rounded-full hover:cursor-pointer hover:bg-background-500"
              onClick={() => setStep(1)}
            >
              Next
            </button>
          </div>
        );
      case 1:
        return (
          <>
            <p className="text-background-300 text-sm font-medium">
              Enter the 6-digit code sent to your email
            </p>
            <div className="flex flex-row gap-2 mt-4">
              {code.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  ref={inputRefs[index]}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  className="w-10 h-10 text-center text-background-100 border border-background-300 rounded"
                />
              ))}
            </div>
            <button
              className="w-full py-2 mt-4 text-background-100 font-medium text-lg bg-background-600 border border-background-400 rounded-full hover:cursor-pointer hover:bg-background-500"
              onClick={() => setStep(2)}
            >
              Verify Code
            </button>
          </>
        );
      case 2:
        return (
          <>
            <p className="text-background-300 text-sm font-medium">
              New Password
            </p>
            <div className="relative w-full mt-2">
              <img
                src={icons.lock}
                alt="Password Icon"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 pl-10 pr-10 p-4 text-background-100 border-b border-background-300 focus:ring-0 focus:outline-none focus:border-b-2 focus:border-background-100"
              />
              <img
                src={showPassword ? icons.eyeCross : icons.eyeCross}
                alt="Toggle Password Visibility"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
            <p className="text-background-300 text-sm font-medium mt-4">
              Confirm New Password
            </p>
            <div className="relative w-full mt-2">
              <img
                src={icons.lock}
                alt="Confirm Password Icon"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 pl-10 pr-10 p-4 text-background-100 border-b border-background-300 focus:ring-0 focus:outline-none focus:border-b-2 focus:border-background-100"
              />
              <img
                src={showConfirmPassword ? icons.eyeCross : icons.eyeCross}
                alt="Toggle Confirm Password Visibility"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </div>
            <button
              className="w-full py-2 mt-4 text-background-100 font-medium text-lg bg-background-600 border border-background-400 rounded-full hover:cursor-pointer hover:bg-background-500"
              onClick={() => {
                /* Reset password logic */
                window.alert("Password reset successfully!");
                window.location.href = "/login";
              }}
            >
              Reset Password
            </button>
          </>
        );
      default:
        return null;
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
        <h1 className="text-3xl font-medium text-background-100 mb-4">
          Forgot Password
        </h1>
        {renderStep()}
      </div>
    </div>
  );
};

export default ForgotPassword;
