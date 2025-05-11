import { View, ImageSourcePropType, Image } from "react-native";
import React from "react";

type ProfileImageProps = {
  character: ImageSourcePropType;
  backgroundColor: string;
};

const ProfileImage = ({ character, backgroundColor }: ProfileImageProps) => {
  return (
    <View
      className="size-24 rounded-full items-center justify-center border border-grayscale-100 overflow-hidden"
      style={{ backgroundColor: backgroundColor }}
    >
      <Image source={character} className="size-16 p-4" />
    </View>
  );
};

export default ProfileImage;
