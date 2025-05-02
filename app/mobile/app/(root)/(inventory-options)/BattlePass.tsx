import { SafeAreaView, ScrollView, View, Text } from "react-native";
import React from "react";

import CustomAppBar from "@/components/CustomAppBar";
import BackButton from "@/components/BackButton";

const BattlePass = () => {
  return (
    <>
      <CustomAppBar title="BATTLE PASS" backButton />
      <SafeAreaView className="flex-1 items-center bg-grayscale-800">
        <ScrollView
          className="w-full p-2"
          contentContainerStyle={{
            paddingBottom: 120,
          }}
        ></ScrollView>
      </SafeAreaView>
    </>
  );
};

export default BattlePass;
