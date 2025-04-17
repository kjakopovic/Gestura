import { useState } from "react";
import { router } from "expo-router";
import { ImageSourcePropType } from "react-native";

interface UseTaskLogicParams {
  correctAnswer: string;
  correctImage?: ImageSourcePropType;
}

export const useTaskLogic = ({
  correctAnswer,
  correctImage,
}: UseTaskLogicParams) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  const handleAnswerPress = (text: string) => {
    setSelectedAnswer(text);
    console.log("Answer pressed!");
  };

  const showResults = () => {
    const resultInfo = selectedAnswer === correctAnswer;
    setIsSuccess(resultInfo);
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

  return {
    selectedAnswer,
    isSuccess,
    popupVisible,
    handleAnswerPress,
    showResults,
    handleContinue,
    setPopupVisible,
    buttonStyle,
    correctImage,
  };
};
