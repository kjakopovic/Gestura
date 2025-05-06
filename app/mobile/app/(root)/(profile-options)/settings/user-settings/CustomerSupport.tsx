import { View, Text } from "react-native";
import { Link } from "expo-router";
import React from "react";

const CustomerSupport = () => {
  return (
    <View>
      <Text>CustomerSupport</Text>
      <Link href={"/Home"} className="absolute top-24 z-50">
        <Text className="text-white">Go to Home</Text>
      </Link>
    </View>
  );
};

export default CustomerSupport;
