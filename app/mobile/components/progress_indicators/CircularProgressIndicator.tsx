import { View, Text } from "react-native";
import React from "react";
import Svg, { Circle } from "react-native-svg";

type CircularProgressIndicatorProps = {
  style?: "primary" | "secondary";
  type?: "Your" | "Battlepass";
  level?: number;
  progress?: number;
};

const CircularProgressIndicator = ({
  style,
  type,
  level,
  progress = 0,
}: CircularProgressIndicatorProps) => {
  // Constants for SVG dimensions
  const size = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View className="flex flex-col items-center">
      {/* Title text above indicator */}
      <Text className="text-white text-lg font-interExtraBold">
        {type === "Your" ? "Your" : "Battlepass"}
      </Text>

      {/* Level text */}
      <Text className="text-white text-2xl font-interExtraBold mb-2">
        Level
      </Text>

      {/* Progress indicator */}
      <View className="w-[100px] h-[100px] justify-center items-center">
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#363636"
            strokeWidth={strokeWidth}
          />

          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill={"none"}
            stroke={style === "primary" ? "#FFC800" : "#A162FF"}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90, ${size / 2}, ${size / 2})`}
          />
        </Svg>

        {/* Level number positioned in the center of circle */}
        <View className="absolute justify-center items-center">
          <Text className="text-center text-white text-2xl font-interExtraBold">
            {level}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default CircularProgressIndicator;
