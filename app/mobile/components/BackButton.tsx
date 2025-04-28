import { TouchableOpacity, Image } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";
import { useRouter } from "expo-router";

type BackButtonProps = {
  absolute?: boolean;
  top?: number;
};

const BackButton = ({ absolute, top }: BackButtonProps) => {
  const router = useRouter();
  const goBack = () => {
    router.back();
  };
  return (
    <TouchableOpacity
      className={`m-5 ${absolute ? "absolute z-50" : ""}`}
      style={{ top: top ? top : undefined }}
      onPress={goBack}
    >
      <Image source={icons.arrowBack} className="size-7" />
    </TouchableOpacity>
  );
};

export default BackButton;
