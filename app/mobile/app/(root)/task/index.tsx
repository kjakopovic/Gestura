import React from "react";
import { Text, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import Task1 from "@/components/tasks/Task1";
import Task2 from "@/components/tasks/Task2";

const task = () => {
  return (
    <ScrollView className="w-full h-full bg-grayscale-800">
      <SafeAreaView className="flex-1 justify-center bg-grayscale-800">
        <StatusBar style="light" />
        {/* trenutno je active task 2, salje se na index.tsx */}
        {/* <Task1 /> */}
        <Task2 />
      </SafeAreaView>
    </ScrollView>
  );
};

export default task;
