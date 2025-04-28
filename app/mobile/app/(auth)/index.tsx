import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import * as icons from "@/constants/icons";
import CustomInput from "@/components/CustomInput";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/schemas/authSchemas";
import { LoginFormData } from "@/types/types";
import CustomButton from "@/components/CustomButton";

const Login = () => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormData) => {
    console.log(data);
    router.replace("/(root)/(tabs)/Home");
    // ...handle login...
  };

  return (
    <ScrollView className="bg-grayscale-800 h-full">
      <View className="flex flex-col items-center justify-start">
        <Image
          source={icons.logo}
          alt="Logo"
          className="h-44 w-44 mt-24"
          resizeMode="stretch"
        />
        <Text className="text-xl font-inter text-grayscale-100 w-1/2 text-center mb-12">
          Login to your account and come back to your Journey in Gestura!
        </Text>
      </View>
      <View className="flex w-full flex-col items-center justify-start px-12 pr-20">
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
        text="LOGIN"
        style="base"
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
          Don&apos;t have an account?{" "}
          <Link href="/(auth)/Register" className="text-primary font-interBold">
            Register
          </Link>
        </Text>
      </View>
      <StatusBar style="light" />
    </ScrollView>
  );
};

export default Login;
