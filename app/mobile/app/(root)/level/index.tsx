import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Task from "@/components/tasks/Task";

// Array of task objects
const tasks = [
  {
    id: "task1",
    section: 10,
    sectionName: "Alphabet Basics",
    version: 1,
    question: "https://example.com/images/handsign_a.png",
    possibleAnswers: ["A", "B", "C", "D"],
    correctAnswerIndex: 0,
  },
  {
    id: "task2",
    section: 20,
    sectionName: "Sign Recognition",
    version: 2,
    question: "C",
    possibleAnswers: [
      "https://example.com/images/handsign_a.png",
      "https://example.com/images/handsign_b.png",
      "https://example.com/images/handsign_c.png",
      "https://example.com/images/handsign_d.png",
    ],
    correctAnswerIndex: 2,
  },
  {
    id: "task3",
    section: 30,
    sectionName: "Letter Matching",
    version: 3,
    question: "https://example.com/images/handsign_b.png",
    possibleAnswers: ["A", "B", "C", "D"],
    correctAnswerIndex: 1,
  },
  {
    id: "task4",
    section: 40,
    sectionName: "Hand Positions",
    version: 1,
    question: "https://example.com/images/handsign_b.png",
    possibleAnswers: ["A", "B", "C", "D"],
    correctAnswerIndex: 1,
  },
  {
    id: "task5",
    section: 50,
    sectionName: "Basic Words",
    version: 2,
    question: "Hello",
    possibleAnswers: [
      "https://example.com/images/sign_hello.png",
      "https://example.com/images/sign_goodbye.png",
      "https://example.com/images/sign_thanks.png",
      "https://example.com/images/sign_yes.png",
    ],
    correctAnswerIndex: 0,
  },
];

const task = () => {
  return (
    <ScrollView className="w-full h-full bg-grayscale-800">
      <SafeAreaView className="w-full h-full justify-center bg-grayscale-800">
        <Task {...tasks[2]} />
      </SafeAreaView>
    </ScrollView>
  );
};

export default task;
