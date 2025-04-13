import React from "react";
import { Text, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import Task1 from "@/components/tasks/Task1";
import Task2 from "@/components/tasks/Task2";
import TaskComplete from "@/components/tasks/TaskComplete";

const task = () => {
  return (
    <ScrollView className="w-full h-full bg-grayscale-800">
      <SafeAreaView className="flex-1 justify-center bg-grayscale-800">
        <StatusBar style="light" />

        {/* trenutno je odkomentiran task1, tako da se na Start task button runna task 1,
        ako se treba runnat nesto drugo, odkomentira se to */}

        <Task1 />
        {/* <Task2 /> */}
        {/* <TaskComplete /> */}
      </SafeAreaView>
    </ScrollView>
  );
};

export default task;
