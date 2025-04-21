import { View, Text } from "react-native";
import React from "react";

const SettingSubtitle = ({ title }: { title: string }) => {
  return (
    <Text className="text-grayscale-100 text-lg font-interExtraBold mb-4">
      {title}
    </Text>
  );
};

export default SettingSubtitle;
