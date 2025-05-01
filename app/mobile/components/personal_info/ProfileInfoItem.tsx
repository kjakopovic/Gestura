import { View, Text, TextInput } from "react-native";
import React from "react";

type ProfileImageProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const ProfileInfoItem = ({
  name,
  value,
  onChange,
  disabled = false,
}: ProfileImageProps) => {
  // Check if value is a subscription type to apply special styling
  const isSubscriptionValue = value === "Live" || value === "Premium";
  const textColor =
    isSubscriptionValue && name === "Subscription" ? "#FFC800" : "white";

  return (
    <View className="flex flex-row items-center justify-between bg-grayscale-800 p-4 px-10 rounded-2xl border border-grayscale-400 mb-4">
      <Text className="text-white text-lg w-1/2 font-interSemiBold">
        {name}
      </Text>
      <TextInput
        style={{
          color: textColor,
          width: "50%",
          fontSize: 16,
          fontFamily: "Inter",
          paddingVertical: 8,
          textAlign: "right",
          height: 32,
          justifyContent: "center",
          opacity: disabled ? 0.7 : 1,
        }}
        value={value}
        onChangeText={onChange}
        placeholder={name}
        placeholderTextColor="#A9A9A9"
        editable={!disabled}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

export default ProfileInfoItem;
