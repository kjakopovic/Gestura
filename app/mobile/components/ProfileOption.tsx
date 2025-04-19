import {
  View,
  Text,
  TouchableOpacity,
  ImageSourcePropType,
  Image,
} from "react-native";
import React from "react";

type ProfileOptionProps = {
  title: string;
  icon: ImageSourcePropType;
  notificationCount?: number;
  onPress?: () => void;
};

const ProfileOption = ({
  title,
  icon,
  notificationCount,
  onPress,
}: ProfileOptionProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row mx-5 items-center rounded-2xl my-2 p-4 border-b-4 border-l-2 border-r-2 border border-grayscale-400"
    >
      <Image source={icon} className="mr-4 size-12" />
      <Text className="flex-1 text-2xl font-interBold text-grayscale-100">
        {title}
      </Text>
      {notificationCount !== undefined && (
        <View className="bg-error rounded-full px-2 py-1 min-w-6 min-h-6 aspect-square items-center justify-center">
          <Text className="text-grayscale-100 font-interMedium text-base">
            {notificationCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ProfileOption;
