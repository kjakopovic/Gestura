import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import * as icons from "@/constants/icons";
import CustomInput from "@/components/CustomInput";
import { loginSchema } from "@/schemas/authSchemas";
import { LoginFormData } from "@/types/types";
import CustomButton from "@/components/CustomButton";
import { getAccessToken, getRefreshToken, login, saveTokens } from "@/lib/auth";
import { api } from "@/lib/api";

// Define the type for the successful response data
type RefreshTokenResponseData = {
  message: string;
  "x-access-token": string;
};

const Login = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();

      if (accessToken && refreshToken) {
        try {
          // Specify the expected response data type for the api.get call
          const response = await api.get<RefreshTokenResponseData>(
            "/refresh/token"
          );
          if (response.success) {
            console.log("Access token refreshed successfully");
            if (response.data) {
              // Use the correct key from the response data type
              await saveTokens(
                response.data["x-access-token"], // Access using bracket notation due to hyphen
                refreshToken
              );
              router.replace("/Home");
            }
          } else {
            console.error("Failed to refresh access token:", response.error);
          }
        } catch (error) {
          console.error("Error refreshing access token:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        console.log("No access or refresh token found. User is not logged in.");
      }
    })();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await login(data);

      if (result.success) {
        console.log("Login successful");
        router.replace("/Home");
      } else {
        setErrorMessage(
          result.error?.message || "Login failed. Please try again."
        );
        console.error("Login failed:", result.error);
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      console.error("Error during login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="bg-grayscale-800 h-full">
      <SafeAreaView className="bg-grayscale-800">
        <View className="flex flex-col items-center justify-start">
          <Image
            source={icons.logo}
            alt="Logo"
            className="h-44 w-44 mt-12"
            resizeMode="stretch"
          />
          <Text className="text-xl font-inter text-grayscale-100 w-1/2 text-center mb-12">
            Login to your account and come back to your Journey in Gestura!
          </Text>
        </View>
        <View className="flex w-full flex-col items-center justify-start px-12 pr-20">
          {errorMessage && (
            <Text className="text-error mb-4 text-center">{errorMessage}</Text>
          )}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <CustomInput
                placeholder="Enter your email address"
                icon={icons.envelope}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.email && (
            <Text className="text-error">{errors.email.message}</Text>
          )}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <CustomInput
                placeholder="Enter your password"
                icon={icons.lock}
                value={value}
                onChangeText={onChange}
                secureTextEntry
              />
            )}
          />
          {errors.password && (
            <Text className="text-error">{errors.password.message}</Text>
          )}
        </View>
        <View className="flex flex-row items-center justify-end w-full mt-1 pr-14">
          <Link
            href="/(auth)/ForgotPassword"
            className="text-primary text-sm font-inter"
          >
            Forgot your password?
          </Link>
        </View>
        <CustomButton
          onPress={handleSubmit(onSubmit)}
          text={isLoading ? "LOGGING IN..." : "LOGIN"}
          style="base"
          disabled={isLoading}
        />

        <View className="flex-row items-center w-full mt-12 px-4">
          <View className="flex-1 border-t border-grayscale-100" />
          <Text className="mx-2 text-grayscale-100">or sign in with</Text>
          <View className="flex-1 border-t border-grayscale-100" />
        </View>

        <View className="flex-row items-center gap-x-5 justify-center w-full my-10 px-4">
          <TouchableOpacity className="">
            <Image
              source={icons.facebook}
              alt="Facebook Icon"
              className="w-10 h-10"
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity className="">
            <Image
              source={icons.apple}
              alt="Apple Icon"
              className="w-10 h-10"
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity className="">
            <Image
              source={icons.google}
              alt="Google Icon"
              className="w-10 h-10"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center justify-center w-full">
          <Text className="text-grayscale-100">
            Don't have an account?{" "}
            <Link
              href="/(auth)/Register"
              className="text-primary font-interBold"
            >
              Register
            </Link>
          </Text>
        </View>
      </SafeAreaView>
      <StatusBar style="light" />
    </ScrollView>
  );
};

export default Login;
