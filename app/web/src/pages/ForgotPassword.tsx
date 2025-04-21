import { useState, useMemo, createRef } from "react";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { ClickableLogo, Input } from "@/components/elements";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES, HelperFunctionResponse } from "@/constants/common";
import {
  Button,
  ButtonType,
  ErrorMessage,
  Typography,
  TypographyType,
} from "@/components/common";
import {
  handleForgotPasswordRequest,
  handleForgotPasswordValidate,
  handlePasswordChange,
} from "@/utils/auth";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputRefs = useMemo(
    () => Array.from({ length: 6 }, () => createRef<HTMLInputElement>()),
    []
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
          <>
            <Input
              className="w-full mb-4"
              type="text"
              label="Email"
              icon={icons.envelope}
              iconAlt="White email icon, little envelope"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type={ButtonType.SECONDARY_OUTLINE}
              text="Next"
              styles="w-full rounded-full p-3 mt-4"
              onClick={async () => {
                const result = await handleForgotPasswordRequest(
                  email,
                  setErrors
                );

                if (result === HelperFunctionResponse.SUCCESS) {
                  setStep(1);
                }
              }}
            />
          </>
        );
      case 1:
        return (
          <>
            <Typography
              type={TypographyType.FOOTER_OPTIONS}
              styles="text-background-300 mb-4 font-medium"
              text="Enter the 6-digit code sent to your email"
            />
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
            <Button
              type={ButtonType.SECONDARY_OUTLINE}
              text="Verify Code"
              styles="w-full rounded-full p-3 mt-4"
              onClick={async () => {
                const result = await handleForgotPasswordValidate(
                  email,
                  code.join(""),
                  setErrors
                );

                if (result === HelperFunctionResponse.SUCCESS) {
                  setStep(2);
                }
              }}
            />
          </>
        );
      case 2:
        return (
          <>
            <Input
              className="w-full mb-4"
              type={showPassword ? "text" : "password"}
              label="Password"
              icon={icons.lock}
              iconAlt="White password icon, little locked lock"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              rightIcon={showConfirmPassword ? icons.eyeCross : icons.eye}
              rightIconAlt={
                showConfirmPassword
                  ? "White, crossed eye icon"
                  : "White eye icon"
              }
              onRightIconClick={() => setShowConfirmPassword((prev) => !prev)}
            />
            <Button
              type={ButtonType.SECONDARY_OUTLINE}
              text="Reset Password"
              styles="w-full rounded-full p-3 mt-4"
              onClick={async () => {
                const result = await handlePasswordChange(
                  email,
                  code.join(""),
                  password,
                  confirmPassword,
                  setErrors
                );

                if (result === HelperFunctionResponse.SUCCESS) {
                  navigate(APP_ROUTES.LOGIN);
                }
              }}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center relative w-full">
      <div className="flex flex-row items-start justify-between w-full p-5 z-10">
        <ClickableLogo
          onClick={() => {
            navigate(APP_ROUTES.LANDING_PAGE);
          }}
        />
      </div>
      <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-between">
        <div className="flex flex-col items-center justify-center h-auto w-[50vw] z-10">
          {errors.length > 0 &&
            errors.map((error, index) => (
              <ErrorMessage
                key={index}
                message={error}
                onClick={() => {
                  setErrors((prev) => prev.filter((_, i) => i !== index));
                }}
              />
            ))}
        </div>
        <div className="flex flex-col items-center justify-between mb-10 lg:mb-[150px] h-1/2 w-1/2 z-10">
          <div className="flex flex-row items-center justify-between mb-4 w-full px-3">
            <img
              alt="White left arrow representing back icon"
              src={icons.back}
              className="w-6 h-6 cursor-pointer"
              onClick={() => {
                setStep((prev) => (prev > 0 ? prev - 1 : prev));
              }}
            />
            <Typography
              type={TypographyType.LANDING_SUBTITLE}
              styles="text-background-100"
              text="Forgot Password?"
            />
          </div>
          {renderStep()}
        </div>
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

export default ForgotPassword;
