import { View, Image, Text } from "react-native";
import React, { useEffect } from "react";
// Don't use router here - let parent components handle navigation
// import { router } from "expo-router";
import { CameraCapturedPicture } from "expo-camera";

import AnswerBox from "./task-components/AnswerBox";
import QuestionBox from "./task-components/QuestionBox";
import TaskBox from "./task-components/TaskBox";
import CustomButton from "../CustomButton";
import ResultPopup from "./task-components/ResultPopup";

import * as characters from "@/constants/characters";
import * as hands from "@/constants/hand-signs";
import CameraComponent from "../CameraComponent";

interface TaskProps {
  id: string;
  section: number;
  sectionName: string;
  version: number;
  question: string;
  possibleAnswers: string[];
  correctAnswerIndex: number;
  onComplete?: () => void;
  onFailure?: () => void;
}

const Task = (task: TaskProps) => {
  const handleAnswerPress = (text: string) => {
    setSelectedAnswer(text);
    console.log("Answer pressed!");
  };

  const correctAnswer = task.possibleAnswers[task.correctAnswerIndex];
  const correctImage =
    task.version === 2
      ? { uri: task.possibleAnswers[task.correctAnswerIndex] }
      : task.version === 3
      ? hands.letter_c
      : null;

  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(
    null
  );
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [popupVisible, setPopupVisible] = React.useState(false);
  const [capturedPhoto, setCapturedPhoto] =
    React.useState<CameraCapturedPicture | null>(null);
  const [showCamera, setShowCamera] = React.useState(true);

  // Handle result and call appropriate callback - remove any automatic timers
  useEffect(() => {
    // We're not going to automatically call the callbacks
    // The ResultPopup will handle the dismissal, and then the user will manually continue
  }, [popupVisible, isSuccess, task]);

  const showResults = () => {
    if (task.version === 3) {
      const success = Math.random() > 0.5;
      setIsSuccess(success);
    } else if (task.version === 2) {
      setIsSuccess(parseInt(selectedAnswer!) === task.correctAnswerIndex);
    } else {
      setIsSuccess(selectedAnswer === correctAnswer);
    }

    setPopupVisible(true);
  };

  const handleContinue = () => {
    if (popupVisible) {
      setPopupVisible(false);
      // After dismissing the popup, now we can call the appropriate callback
      if (isSuccess && task.onComplete) {
        task.onComplete();
      } else if (!isSuccess && task.onFailure) {
        task.onFailure();
      }
    } else {
      showResults();
    }
  };

  const handlePopupDismiss = () => {
    setPopupVisible(false);
    // After dismissing the popup, now we can call the appropriate callback
    if (isSuccess && task.onComplete) {
      task.onComplete();
    } else if (!isSuccess && task.onFailure) {
      task.onFailure();
    }
  };

  const handleSavePhoto = (photo: CameraCapturedPicture) => {
    console.log("Photo saved:", photo.uri);
    console.log(showCamera);
    setCapturedPhoto(photo);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const isButtonDisabled = () => {
    if (task.version === 3) {
      return capturedPhoto === null;
    } else {
      return selectedAnswer === null;
    }
  };

  const buttonStyle =
    task.version === 2
      ? parseInt(selectedAnswer || "-1") === task.correctAnswerIndex
        ? "success"
        : "fail"
      : selectedAnswer === correctAnswer
      ? "success"
      : "fail";

  return task.version === 1 ? (
    <View className="flex-1 justify-center items-start">
      <QuestionBox text="What letter does this symbol represent?" />
      <View className="w-full flex-row justify-center items-end">
        <Image className="m-8 mt-4 mb-0 w-50%" source={characters.character1} />
        <TaskBox image={task.question} />
      </View>

      <View className="w-full h-[1px] bg-grayscale-400 mb-8" />

      <View className="w-full flex-row flex-wrap justify-evenly m-0">
        {task.possibleAnswers.map((answer, index) => (
          <AnswerBox
            key={index}
            onPress={handleAnswerPress}
            text={answer}
            answerValue={answer}
            isSelected={selectedAnswer === answer}
          />
        ))}
      </View>
      <CustomButton
        onPress={handleContinue}
        text="CONTINUE"
        style="base"
        disabled={isButtonDisabled()}
      />

      <ResultPopup
        visible={popupVisible}
        isSuccess={isSuccess}
        correctAnswer={correctAnswer}
        onDismiss={handlePopupDismiss}
        buttonStyle={buttonStyle}
      />
    </View>
  ) : task.version === 2 ? (
    <View className="flex-1 justify-center items-start">
      <QuestionBox text="What symbol does this letter represent?" />
      <View className="w-full flex-row justify-center items-end">
        <Image className="m-8 mt-4 mb-0 w-50%" source={characters.character1} />
        <TaskBox text={task.question} />
      </View>

      <View className="w-full h-[1px] bg-grayscale-400 mb-8" />

      <View className="w-full m-0">
        <View className="flex-row flex-wrap justify-evenly w-full">
          {task.possibleAnswers.map((imageUrl, index) => (
            <AnswerBox
              key={index}
              onPress={handleAnswerPress}
              image={imageUrl}
              answerValue={`${index}`}
              isSelected={selectedAnswer === `${index}`}
            />
          ))}
        </View>
      </View>
      <CustomButton
        onPress={handleContinue}
        text="CONTINUE"
        style="base"
        disabled={isButtonDisabled()}
      />

      <ResultPopup
        visible={popupVisible}
        isSuccess={isSuccess}
        correctImage={correctImage}
        onDismiss={handlePopupDismiss}
        buttonStyle={buttonStyle}
      />
    </View>
  ) : task.version === 3 ? (
    <View className="flex-1 justify-start items-start">
      <QuestionBox text="Show me how you would sign the following:" />
      <View className="w-full flex-row justify-center items-end">
        <Image className="m-8 mt-4 mb-0 w-50%" source={characters.character1} />
        <TaskBox image={task.question} />
      </View>

      <View className="w-full h-[1px] bg-grayscale-400 mb-8" />

      <CameraComponent
        onSavePhoto={handleSavePhoto}
        onCloseCamera={handleCloseCamera}
      />

      <View className="w-full items-center mt-5">
        <CustomButton
          noMargin
          onPress={handleContinue}
          text="CONTINUE"
          style="base"
          disabled={isButtonDisabled()}
        />
      </View>

      <ResultPopup
        visible={popupVisible}
        isSuccess={isSuccess}
        correctImage={correctImage}
        onDismiss={handlePopupDismiss}
        buttonStyle={isSuccess ? "success" : "error"}
        taskVersion={task.version}
      />
    </View>
  ) : (
    <View className="flex-1 justify-center items-center">
      <Text className="text-lg text-grayscale-900 mb-4">
        Unknown task version
      </Text>
      <CustomButton
        onPress={() => task.onFailure?.()}
        text="GO BACK"
        style="base"
      />
    </View>
  );
};

export default Task;
