import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from "react-native";
import { LevelType, LevelState } from "@/types/levels";
import { getButtonStyle } from "./styles";

interface LevelButtonProps {
  level: number;
  type: LevelType;
  state: LevelState;
  style: string;
  icon: ImageSourcePropType;
  onPress: () => void;
}

const LevelButton = ({
  level,
  type,
  state,
  onPress,
  icon,
  style,
}: LevelButtonProps) => {
  const buttonStyle = getButtonStyle(type, state, style);

  return type === "normal" ? (
    <TouchableOpacity
      onPress={onPress}
      className={`flex items-center justify-center border-8 ${
        state === "unlocked" ? "shadow-md shadow-secondary/30" : ""
      } border-grayscale-700 ${buttonStyle}`}
      disabled={state === "locked"}
    >
      <Image
        source={icon}
        className={`w-12 h-12 ${state === "locked" ? "opacity-50" : ""}`}
        resizeMode="contain"
      />
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      onPress={onPress}
      className={`flex items-center justify-center ${
        state === "unlocked" ? "shadow-md shadow-secondary/50" : ""
      } ${buttonStyle}`}
      disabled={state === "locked"}
    >
      <Image
        source={icon}
        className={`w-10 h-10 mx-6 my-4 ${
          state === "locked" ? "opacity-50" : ""
        }`}
        resizeMode="contain"
        tintColor={state === "locked" ? "gray" : undefined}
      />
      <View
        className={`${
          state === "locked"
            ? "bg-grayscale-400"
            : style === "battlepass"
            ? "bg-primary"
            : "bg-secondary"
        } h-0.5 w-full `}
      />
      <Text
        className={`text-lg font-bold my-1 ${
          state === "locked"
            ? "opacity-50 text-grayscale-300"
            : style === "battlepass"
            ? "text-primary"
            : "text-secondary"
        }`}
      >
        {level}
      </Text>
    </TouchableOpacity>
  );
};

export default LevelButton;
