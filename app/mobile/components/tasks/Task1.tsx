import { View, Image } from "react-native";
import React from "react";

import AnswerBox from "./task-components/AnswerBox";
import QuestionBox from "./task-components/QuestionBox";
import TaskBox from "./task-components/TaskBox";
import CustomButton from "../CustomButton";
import ResultPopup from "./task-components/ResultPopup";

import * as characters from "@/constants/characters";
import * as hands from "@/constants/hand-signs";
import { useTaskLogic } from "@/hooks/useTaskLogic";

const Task1 = () => {
  const correctAnswer = "C";
  const correctImage = hands.letter_c;

  const {
    selectedAnswer,
    isSuccess,
    popupVisible,
    handleAnswerPress,
    handleContinue,
    setPopupVisible,
    buttonStyle,
  } = useTaskLogic({ correctAnswer, correctImage });

  return (
    <View className="flex-1 justify-center items-start">
      <QuestionBox text="What letter does this symbol represent?" />
      <View className="w-full flex-row justify-center items-end">
        <Image className="m-8 mt-4 mb-0 w-50%" source={characters.character1} />
        {/* ako nekako nema slike, defaulta se na error_testing.png */}
        <TaskBox image={correctImage} />
      </View>

      <View className="w-full h-[1px] bg-grayscale-400 mb-8" />

      <View className="w-full m-0">
        <View className="flex-row justify-evenly w-full">
          <AnswerBox
            onPress={handleAnswerPress}
            text="A"
            answerValue="A"
            isSelected={selectedAnswer === "A"}
          />
          <AnswerBox
            onPress={handleAnswerPress}
            text="B"
            answerValue="B"
            isSelected={selectedAnswer === "B"}
          />
        </View>
        <View className="flex-row justify-evenly w-full">
          <AnswerBox
            onPress={handleAnswerPress}
            text="C"
            answerValue="C"
            isSelected={selectedAnswer === "C"}
          />
          <AnswerBox
            onPress={handleAnswerPress}
            text="D"
            answerValue="D"
            isSelected={selectedAnswer === "D"}
          />
        </View>
      </View>
      <CustomButton onPress={handleContinue} text="CONTINUE" style="base" />

      <ResultPopup
        visible={popupVisible}
        isSuccess={isSuccess}
        correctAnswer={correctAnswer}
        onDismiss={() => setPopupVisible(false)}
        buttonStyle={buttonStyle}
      />
    </View>
  );
};

export default Task1;
