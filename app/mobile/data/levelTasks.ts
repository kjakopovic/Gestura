import { LevelTask } from "@/hooks/useLevelTasks";

// Sample tasks for levels - in a real app, these would come from an API
export const levelTasksMap: Record<number, LevelTask[]> = {
  1: [
    {
      id: "task1_1",
      section: 10,
      sectionName: "Alphabet Basics",
      version: 1,
      question: "https://example.com/images/handsign_a.png",
      possibleAnswers: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
    },
    {
      id: "task1_2",
      section: 10,
      sectionName: "Alphabet Basics",
      version: 1,
      question: "https://example.com/images/handsign_b.png",
      possibleAnswers: ["A", "B", "C", "D"],
      correctAnswerIndex: 1,
    },
  ],
  2: [
    {
      id: "task2_1",
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
      id: "task2_2",
      section: 20,
      sectionName: "Sign Recognition",
      version: 2,
      question: "D",
      possibleAnswers: [
        "https://example.com/images/handsign_a.png",
        "https://example.com/images/handsign_b.png",
        "https://example.com/images/handsign_c.png",
        "https://example.com/images/handsign_d.png",
      ],
      correctAnswerIndex: 3,
    },
    {
      id: "task2_3",
      section: 20,
      sectionName: "Sign Recognition",
      version: 2,
      question: "A",
      possibleAnswers: [
        "https://example.com/images/handsign_a.png",
        "https://example.com/images/handsign_b.png",
        "https://example.com/images/handsign_c.png",
        "https://example.com/images/handsign_d.png",
      ],
      correctAnswerIndex: 0,
    },
  ],
  3: [
    {
      id: "task3_1",
      section: 30,
      sectionName: "Letter Matching",
      version: 3,
      question: "https://example.com/images/handsign_b.png",
      possibleAnswers: ["A", "B", "C", "D"],
      correctAnswerIndex: 1,
    },
    {
      id: "task3_2",
      section: 30,
      sectionName: "Letter Matching",
      version: 1,
      question: "https://example.com/images/handsign_c.png",
      possibleAnswers: ["A", "B", "C", "D"],
      correctAnswerIndex: 2,
    },
    {
      id: "task3_3",
      section: 30,
      sectionName: "Letter Matching",
      version: 2,
      question: "F",
      possibleAnswers: [
        "https://example.com/images/handsign_d.png",
        "https://example.com/images/handsign_e.png",
        "https://example.com/images/handsign_f.png",
        "https://example.com/images/handsign_g.png",
      ],
      correctAnswerIndex: 2,
    },
  ],
};
