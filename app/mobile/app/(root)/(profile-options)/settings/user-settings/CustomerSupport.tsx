import CustomAppBar from "@/components/CustomAppBar";
import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CustomerSupport = () => (
  <>
    <CustomAppBar title="CUSTOMER SUPPORT" backButton />
    <SafeAreaView className="w-full h-full bg-grayscale-800 flex items-center justify-center p-4">
      <Text className="font-interBold text-xl text-grayscale-100">
        Contact us via email:
      </Text>
      <Text className="font-inter text-lg text-grayscale-100">
        support@ges-tura.com
      </Text>
    </SafeAreaView>
  </>
);

export default CustomerSupport;
