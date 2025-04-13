import { View, Image, Text } from "react-native";
import React from "react";
import { router } from "expo-router";

import AnswerBox from "./task-components/AnswerBox";
import QuestionBox from "./task-components/QuestionBox";
import TaskBox from "./task-components/TaskBox";
import CustomButton from "../CustomButton";
import ResultPopup from "./task-components/ResultPopup";

import * as characters from "@/constants/characters";
import * as hands from "@/constants/hand-signs";

const Task1 = () => {
  const handleAnswerPress = (text: string) => {
    setSelectedAnswer(text);
    console.log("Answer pressed!");
  };

  const correctAnswer = "A";
  const correctImage = hands.letter_a;

  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(
    null
  );
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [popupVisible, setPopupVisible] = React.useState(false);

  const showResults = () => {
    const resultinfo = selectedAnswer === correctAnswer;
    setIsSuccess(resultinfo);
    setPopupVisible(true);
  };

  const handleContinue = () => {
    if (popupVisible) {
      setPopupVisible(false);
      goToHome();
    } else {
      showResults();
    }
  };

  const goToHome = () => {
    router.push("/(root)/(tabs)/Home");
  };

  const buttonStyle = selectedAnswer === correctAnswer ? "success" : "fail";

  return (
    <View className="flex-1 justify-center items-start">
      <QuestionBox text="What symbol does this letter represent?" />
      {/* <View className="h-2 w-full border-t-[2px] border-grayscale-100" /> */}
      <View className="w-full flex-row justify-center items-end">
        <Image className="m-8 mt-4 mb-0 w-50%" source={characters.character1} />
        <TaskBox text={correctAnswer} />
      </View>

      <View className="w-full h-[1px] bg-grayscale-400 mb-8" />

      <View className="w-full m-0">
        <View className="flex-row justify-evenly w-full">
          <AnswerBox
            onPress={handleAnswerPress}
            image={hands.letter_a}
            answerValue="A"
            isSelected={selectedAnswer === "A"}
          />
          <AnswerBox
            onPress={handleAnswerPress}
            image={hands.letter_l}
            answerValue="L"
            isSelected={selectedAnswer === "L"}
          />
        </View>
        <View className="flex-row justify-evenly w-full">
          <AnswerBox
            onPress={handleAnswerPress}
            image={hands.letter_o}
            answerValue="O"
            isSelected={selectedAnswer === "O"}
          />
          <AnswerBox
            onPress={handleAnswerPress}
            image={hands.letter_v}
            answerValue="V"
            isSelected={selectedAnswer === "V"}
          />
        </View>
      </View>
      <CustomButton onPress={handleContinue} text="CONTINUE" style="base" />

      <ResultPopup
        visible={popupVisible}
        isSuccess={isSuccess}
        correctImage={correctImage}
        onDismiss={() => setPopupVisible(false)} //za refocus bug
        buttonStyle={buttonStyle}
      />
    </View>
  );
};

export default Task1;
