import { View, Text } from "react-native";
import React from "react";

type LineProgressIndicatorProps = {
  style: "xp" | "progress";
  progress: number;
};

const LineProgressIndicator = ({
  style,
  progress,
}: LineProgressIndicatorProps) => {
  // Get styles for container and progress bar based on style prop
  const getStyles = (styleType: "xp" | "progress") => {
    return {
      containerStyle:
        styleType === "xp"
          ? "h-4 w-full rounded-full bg-grayscale-500"
          : "h-4 w-full border border-grayscale-400 rounded-full bg-transparent",
      progressStyle:
        styleType === "xp"
          ? "bg-secondary"
          : "bg-success border border-success",
    };
  };

  const styles = getStyles(style);

  return (
    <View className={styles.containerStyle}>
      <View
        className={`h-full ${styles.progressStyle} rounded-full`}
        style={{ width: `${progress}%` }}
      ></View>
    </View>
  );
};

export default LineProgressIndicator;
