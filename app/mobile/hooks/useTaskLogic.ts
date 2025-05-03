import { useState } from "react";
import { ImageSourcePropType } from "react-native";

interface UseTaskLogicParams {
  correctAnswer: string;
  correctImage?: ImageSourcePropType;
  onComplete?: () => void;
  onFailure?: () => void;
  skipNavigation?: boolean;
}

export const useTaskLogic = ({
  correctAnswer,
  correctImage,
  onComplete,
  onFailure,
  skipNavigation = false,
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

    // If successful, call onComplete callback
    if (resultInfo && onComplete) {
      setTimeout(() => {
        onComplete();
      }, 2000); // Wait for popup to be visible
    } else if (!resultInfo && onFailure) {
      setTimeout(() => {
        onFailure();
      }, 2000);
    }
  };

  const handleContinue = () => {
    if (popupVisible) {
      setPopupVisible(false);
      if (!skipNavigation) {
        if (isSuccess && onComplete) {
          onComplete();
        } else if (!isSuccess && onFailure) {
          onFailure();
        }
      }
    } else {
      showResults();
    }
  };

  const buttonStyle = (
    selectedAnswer === correctAnswer ? "success" : "fail"
  ) as "success" | "fail" | "base" | "error";

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
