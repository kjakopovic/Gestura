import { View, ImageSourcePropType, Image } from "react-native";
import React from "react";

type ProfileImageProps = {
  character: ImageSourcePropType;
  backgroundColor: string;
};

const ProfileImage = ({ character, backgroundColor }: ProfileImageProps) => {
  return (
    <View
      className="w-24 h-24 rounded-full border border-grayscale-100 overflow-hidden"
      style={{ backgroundColor: backgroundColor }}
    >
      <Image source={character} className="w-full h-full p-4" />
    </View>
  );
};

export default ProfileImage;
