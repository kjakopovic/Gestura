import { Alert, SafeAreaView } from "react-native";
import React from "react";
import CustomButton from "@/components/CustomButton";

import { useRouter } from "expo-router";

const CommChoice = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex flex-col w-full h-full justify-center items-center p-6 pt-72">
      <CustomButton
        text="SIGNER"
        style="base"
        onPress={() => router.push("/(root)/(premium-options)/Signer")}
      />
      <CustomButton
        text="TALKER"
        style="base"
        onPress={() => {
          Alert.alert("Coming Soon", "This feature is not available in beta", [
            { text: "OK", onPress: () => {} },
          ]);
        }}
      />
    </SafeAreaView>
  );
};

export default CommChoice;
