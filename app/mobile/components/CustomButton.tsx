import { View, Text, TouchableOpacity } from "react-native";
import React from "react";

type CustomButtonProps = {
  onPress: () => void;
  text: string;
  style?: string;
  marginTop?: number;
  disabled?: boolean;
};

const CustomButton = ({
  onPress,
  text,
  style,
  marginTop,
  disabled = false,
}: CustomButtonProps) => {
  return (
    <TouchableOpacity
      className={`w-3/4 self-center py-4 border ${
        style === "base"
          ? "border-grayscale-400"
          : style === "success"
          ? "border-success"
          : "border-error"
      } ${
        disabled ? "opacity-50" : "opacity-100"
      } bg-grayscale-700 rounded-2xl ${
        marginTop ? `mt-${marginTop}` : "mt-16"
      }`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        className={`${
          style === "base"
            ? "text-grayscale-100"
            : style === "success"
            ? "text-success"
            : "text-error"
        } text-lg font-interExtraBold text-center`}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomButton;
