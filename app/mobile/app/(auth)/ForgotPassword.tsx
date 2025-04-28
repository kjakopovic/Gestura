import { View, Text, Image, ScrollView, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useRef } from "react";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";

import CustomInput from "@/components/CustomInput";
import * as icons from "@/constants/icons";
import CustomButton from "@/components/CustomButton";
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

//TODO - Extract funcitons to a separate file
//TODO - Add comments to functions
const ForgotPassword = () => {
  // currentStep: 1 = email, 2 = code, 3 = new password
  const [step, setStep] = useState(1);

  // Optionally store email for later use.
  const [userEmail, setUserEmail] = useState("");

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

  const onEmailSubmit = (data: ForgotEmailFormData) => {
    console.log("Email:", data.email);
    setUserEmail(data.email);
    setStep(2);
  };

  const onCodeSubmit = (data: ForgotCodeFormData) => {
    // Combine digits into a code string if needed
    const code =
      data.digit1 +
      data.digit2 +
      data.digit3 +
      data.digit4 +
      data.digit5 +
      data.digit6;
    console.log("Verification Code:", code);
    setStep(3);
  };

  const onPasswordSubmit = (data: ForgotPasswordFormData) => {
    console.log("New Password:", data.newPassword);
    // ...handle password reset...
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

        {step === 1 && (
          <View className="w-full">
            <Text className="text-grayscale-100 mb-4">Enter your email</Text>
            <Controller
              control={emailControl}
              name="email"
              render={({ field: { onChange, value } }) => (
                <CustomInput
                  placeholder="Enter your email address"
                  value={value}
                  onChangeText={onChange}
                  icon={icons.envelope}
                  className="w-[90%]"
                />
              )}
            />
            {emailErrors.email && (
              <Text className="text-error">{emailErrors.email.message}</Text>
            )}
            <CustomButton
              text="NEXT"
              onPress={handleEmailSubmit(onEmailSubmit)}
              style="base"
            />
          </View>
        )}

        {step === 2 && (
          <View className="w-full">
            <Text className="text-grayscale-100 mb-4">
              Enter the 6-digit code sent to {userEmail}
            </Text>
            <View className="flex-row justify-between">
              {[1, 2, 3, 4, 5, 6].map((num, index) => (
                <Controller
                  key={num}
                  control={codeControl}
                  name={`digit${num}` as keyof ForgotCodeFormData}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      ref={digitRefs[index]}
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        if (text && index < digitRefs.length - 1) {
                          digitRefs[index + 1].current?.focus();
                        }
                      }}
                      className="w-14 h-14 rounded-xl mx-2 text-grayscale-100 text-center border border-grayscale-300 focus:ring-0 focus:outline-none focus:border-2 focus:border-grayscale-100"
                      maxLength={1}
                      keyboardType="number-pad"
                    />
                  )}
                />
              ))}
            </View>
            {/* Display first encountered error (if any) */}
            {Object.values(codeErrors)[0] && (
              <Text className="text-error">
                {(Object.values(codeErrors)[0] as FieldError)?.message}
              </Text>
            )}
            <CustomButton
              text="VERIFY"
              onPress={handleCodeSubmit(onCodeSubmit)}
              style="base"
            />
          </View>
        )}

        {step === 3 && (
          <View className="w-full">
            <Text className="text-grayscale-100 mb-4">
              Enter your new password
            </Text>
            <Controller
              control={passwordControl}
              name="newPassword"
              render={({ field: { onChange, value } }) => (
                <CustomInput
                  placeholder="Enter new password"
                  value={value}
                  onChangeText={onChange}
                  icon={icons.lock}
                  secureTextEntry
                  className="w-[90%]"
                />
              )}
            />
            {passwordErrors.newPassword && (
              <Text className="text-error">
                {passwordErrors.newPassword.message}
              </Text>
            )}
            <Controller
              control={passwordControl}
              name="confirmNewPassword"
              render={({ field: { onChange, value } }) => (
                <CustomInput
                  placeholder="Confirm new password"
                  value={value}
                  onChangeText={onChange}
                  icon={icons.lock}
                  secureTextEntry
                  className="w-[90%]"
                />
              )}
            />
            {passwordErrors.confirmNewPassword && (
              <Text className="text-error">
                {passwordErrors.confirmNewPassword.message}
              </Text>
            )}
            <CustomButton
              text="RESET PASSWORD"
              onPress={handlePasswordSubmit(onPasswordSubmit)}
              style="base"
            />
          </View>
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
