import { Text, TouchableOpacity } from "react-native";
import React from "react";

type CustomButtonProps = {
  onPress: () => void;
  text: string;
  style?: "base" | "success" | "error";
  noMargin?: boolean;
  disabled?: boolean;
};

const CustomButton = ({
  onPress,
  text,
  style,
  disabled,
  noMargin,
  ...rest
}: CustomButtonProps) => {
  return (
    <TouchableOpacity
      className={`w-3/4 self-center py-4 border ${
        style === "base"
          ? "border-grayscale-400 bg-grayscale-700"
          : style === "success"
          ? "border-success bg-grayscale-700"
          : "border-error bg-error/10"
      } rounded-2xl ${noMargin ? "" : "mt-16"} ${
        disabled ? "opacity-50" : "opacity-100"
      }`}
      onPress={onPress}
      disabled={disabled}
      {...rest}
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
