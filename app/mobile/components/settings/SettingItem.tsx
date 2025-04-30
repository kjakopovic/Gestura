import {
  Text,
  ImageSourcePropType,
  Image,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";

type SettingItemProps = {
  title: string;
  type: "toggle" | "select" | "button";
  value?: boolean;
  selected?: boolean;
  image?: ImageSourcePropType;
  onPress?: () => void;
  onChange?: (value: boolean) => void;
};

const SettingItem = ({
  title,
  type,
  value,
  selected,
  image,
  onPress,
  onChange,
}: SettingItemProps) => {
  return (
    <TouchableOpacity
      className={`flex-row items-center rounded-2xl my-2 p-4 border ${
        type === "button"
          ? "border-grayscale-400"
          : type === "select" && selected
          ? "border-success"
          : "border-grayscale-400"
      }`}
      onPress={onPress}
    >
      {/* Show image on left for types other than select */}
      {image && type !== "select" && <Image source={image} className="mr-4" />}

      <Text
        className={`flex-1 text-lg font-interBold text-grayscale-100 ${
          type === "button" ? "ml-10" : ""
        }`}
      >
        {title}
      </Text>

      {type === "toggle" && (
        <View className="border border-grayscale-300 rounded-full p-[1px]">
          <Switch
            value={value}
            onValueChange={onChange}
            thumbColor={value ? "#89E219" : "#FF4B4B"}
            trackColor={{ false: "transparent", true: "transparent" }}
            ios_backgroundColor="transparent"
          />
        </View>
      )}

      {/* Show image on right for select type */}
      {image && type === "select" && (
        <Image
          source={image}
          className="ml-2"
          style={{ width: 24, height: 24 }}
        />
      )}
    </TouchableOpacity>
  );
};

export default SettingItem;
