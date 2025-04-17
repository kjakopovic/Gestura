import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import CustomInput from "@/components/CustomInput";
import * as icons from "@/constants/icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/schemas/authSchemas";
import { RegisterFormData } from "@/types/types";
import CustomButton from "@/components/CustomButton";

const Register = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    console.log(data);
    // ...handle registration...
  };

  return (
    <ScrollView className="bg-grayscale-800 h-full">
      <View className="flex flex-col items-center justify-start">
        <Image
          source={icons.logo}
          alt="Logo"
          className="h-44 w-44 mt-12"
          resizeMode="stretch"
        />
        <Text className="text-xl font-inter text-grayscale-100 w-1/2 text-center mb-12">
          Register your account to start a new Journey with Gestura!
        </Text>
      </View>

      <View className="flex w-full flex-col items-center justify-start px-12 pr-20">
        {/* Username */}
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, value } }) => (
            <CustomInput
              placeholder="Enter your username"
              value={value}
              onChangeText={onChange}
              icon={icons.person}
            />
          )}
        />
        {errors.username && (
          <Text className="text-error">{errors.username.message}</Text>
        )}

        {/* Email */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <CustomInput
              placeholder="Enter your email address"
              value={value}
              onChangeText={onChange}
              icon={icons.envelope}
            />
          )}
        />
        {errors.email && (
          <Text className="text-error">{errors.email.message}</Text>
        )}

        {/* Password */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <CustomInput
              placeholder="Enter your password"
              value={value}
              onChangeText={onChange}
              icon={icons.lock}
              secureTextEntry
            />
          )}
        />
        {errors.password && (
          <Text className="text-error">{errors.password.message}</Text>
        )}

        {/* Confirm Password */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <CustomInput
              placeholder="Confirm your password"
              value={value}
              onChangeText={onChange}
              icon={icons.lock}
              secureTextEntry
            />
          )}
        />
        {errors.confirmPassword && (
          <Text className="text-error">{errors.confirmPassword.message}</Text>
        )}
      </View>

      <CustomButton
        text="REGISTER"
        onPress={handleSubmit(onSubmit)}
        style="base"
      />

      <View className="flex-row items-center w-full mt-12 px-4">
        <View className="flex-1 border-t border-grayscale-100" />
        <Text className="mx-2 text-grayscale-100">or sign in with</Text>
        <View className="flex-1 border-t border-grayscale-100" />
      </View>

      <View className="flex-row items-center gap-x-5 justify-center w-full my-6 px-4">
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
          Already have an account?{" "}
          <Link href="/(auth)" className="text-primary font-interBold">
            Login
          </Link>
        </Text>
      </View>
      <StatusBar style="light" />
    </ScrollView>
  );
};

export default Register;
