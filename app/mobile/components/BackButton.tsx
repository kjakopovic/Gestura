import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";

import * as icons from "@/constants/icons";
import { useRouter } from "expo-router";

const BackButton = () => {
  const router = useRouter();
  const goBack = () => {
    router.back();
  };
  return (
    <TouchableOpacity className="m-5" onPress={goBack}>
      <Image source={icons.arrowBack} className="size-7" />
    </TouchableOpacity>
  );
};

export default BackButton;
