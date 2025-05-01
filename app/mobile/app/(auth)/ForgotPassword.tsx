import { View, Text, Image, ScrollView, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useRef } from "react";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";

import * as icons from "@/constants/icons";
import {
  forgotEmailSchema,
  forgotCodeSchema,
  forgotPasswordSchema,
} from "@/schemas/authSchemas";
import {
  ForgotEmailFormData,
  ForgotCodeFormData,
  ForgotPasswordFormData,
} from "@/types/types";
import {
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from "@/lib/auth";
import {
  EmailStep,
  CodeStep,
  PasswordStep,
} from "@/components/ResetPasswordSteps";

const ForgotPassword = () => {
  // currentStep: 1 = email, 2 = code, 3 = new password
  const router = useRouter();
  const [step, setStep] = useState(1);
  // Store user data in a single state object
  const [userData, setUserData] = useState({ email: "", code: "" });

  // Loading state for buttons
  const [isLoading, setIsLoading] = useState(false);
  // Error message state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add refs for auto focusing inputs in code verification step
  const digitRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Step 1 form
  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<ForgotEmailFormData>({
    resolver: zodResolver(forgotEmailSchema),
    defaultValues: { email: "" },
  });

  // Step 2 form
  const {
    control: codeControl,
    handleSubmit: handleCodeSubmit,
    formState: { errors: codeErrors },
  } = useForm<ForgotCodeFormData>({
    resolver: zodResolver(forgotCodeSchema),
    defaultValues: {
      digit1: "",
      digit2: "",
      digit3: "",
      digit4: "",
      digit5: "",
      digit6: "",
    },
  });

  // Step 3 form
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });

  const onEmailSubmit = async (data: ForgotEmailFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await requestPasswordReset(data);

      if (result.success) {
        setUserData((prev) => ({ ...prev, email: data.email }));
        setStep(2);
      } else {
        setErrorMessage(
          result.error?.message ||
            "Failed to send reset email. Please try again."
        );
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      console.error("Error during email submission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onCodeSubmit = async (data: ForgotCodeFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await verifyResetCode(data, userData.email);

      if (result.success) {
        // Combine all digits into a single string
        const combinedCode = `${data.digit1}${data.digit2}${data.digit3}${data.digit4}${data.digit5}${data.digit6}`;
        setUserData((prev) => ({ ...prev, code: combinedCode }));
        setStep(3);
      } else {
        setErrorMessage(
          result.error?.message || "Failed to verify code. Please try again."
        );
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      console.error("Error during code verification:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await resetPassword(data, userData.email, userData.code);

      if (result.success) {
        // Navigate to login or show success message
        console.log("Password reset successful");
        router.push("/(auth)");
      } else {
        setErrorMessage(
          result.error?.message || "Failed to reset password. Please try again."
        );
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      console.error("Error during password reset:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="bg-grayscale-800 h-full p-4">
      <SafeAreaView className="flex flex-col items-center justify-start">
        <Image
          source={icons.logo}
          alt="Logo"
          className="h-44 w-44 mt-12"
          resizeMode="stretch"
        />
        <Text className="text-xl font-inter text-grayscale-100 w-3/4 text-center my-6">
          Reset your password
        </Text>

        {errorMessage && (
          <Text className="text-error mb-4 text-center">{errorMessage}</Text>
        )}

        {step === 1 && (
          <EmailStep
            control={emailControl}
            errors={emailErrors}
            isLoading={isLoading}
            onSubmit={handleEmailSubmit(onEmailSubmit)}
          />
        )}

        {step === 2 && (
          <CodeStep
            control={codeControl}
            errors={codeErrors}
            isLoading={isLoading}
            onSubmit={handleCodeSubmit(onCodeSubmit)}
            email={userData.email}
            digitRefs={digitRefs}
          />
        )}

        {step === 3 && (
          <PasswordStep
            control={passwordControl}
            errors={passwordErrors}
            isLoading={isLoading}
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
          />
        )}

        <View className="mt-12">
          <Link href="/(auth)" className="text-primary font-interBold">
            Back to Login
          </Link>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    </ScrollView>
  );
};

export default ForgotPassword;
