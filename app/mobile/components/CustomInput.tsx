import { View, Image, TextInput } from "react-native";
import React from "react";

import { CustomInputProps } from "@/types/types";

const CustomInput = ({
  value,
  icon,
  placeholder,
  onChangeText,
  className,
  ...rest
}: CustomInputProps) => {
  return (
    <View className="flex w-full flex-row items-center justify-start mr-4 mt-6">
      <Image
        source={icon}
        alt="Email Icon"
        className="w-4 h-4 mx-2"
        resizeMode="contain"
        tintColor={"#f5f5f5"}
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        placeholder={placeholder}
        placeholderTextColor={"#5F5F5F"}
        value={value}
        onChangeText={onChangeText}
        className={`py-2 w-full ${className} text-grayscale-100 border-b border-grayscale-300 focus:ring-0 focus:outline-none focus:border-b-2 focus:border-grayscale-100`}
        {...rest}
      />
    </View>
  );
};

export default CustomInput;
