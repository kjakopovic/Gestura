import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { router } from "expo-router";

const Home = () => {
  const goToTask = () => {
    router.push("/level"); //redirect na task
  };
  return (
    <ScrollView className="bg-grayscale-800">
      <Text>Home</Text>
      <TouchableOpacity
        onPress={goToTask}
        className="bg-grayscale-500 py-4 px-6 rounded-xl w-full items-center"
      >
        <Text className="text-white font-semibold text-lg">Start Task</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Home;
