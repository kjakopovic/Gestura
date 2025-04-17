import { View, Image, Text, ActivityIndicator } from "react-native";
import React, { useEffect } from "react";
import { router } from "expo-router";
import { CameraCapturedPicture } from "expo-camera";

import AnswerBox from "./task-components/AnswerBox";
import QuestionBox from "./task-components/QuestionBox";
import TaskBox from "./task-components/TaskBox";
import CustomButton from "../CustomButton";
import ResultPopup from "./task-components/ResultPopup";

import * as characters from "@/constants/characters";
import * as hands from "@/constants/hand-signs";
import CameraComponent from "../CameraComponent";

type Task = {
  id: string;
  section: number;
  sectionName: string;
  version: number;
  question: string;
  possibleAnswers: string[];
  correctAnswerIndex: number;
};

const Task = (task: Task) => {
  const handleAnswerPress = (text: string) => {
    setSelectedAnswer(text);
    console.log("Answer pressed!");
  };

  const correctAnswer = task.possibleAnswers[task.correctAnswerIndex];
  const correctImage =
    task.version === 2
      ? { uri: task.possibleAnswers[task.correctAnswerIndex] }
      : task.version === 3
      ? hands.letter_c // This would need to be determined dynamically in a real app
      : null;

  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(
    null
  );
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [popupVisible, setPopupVisible] = React.useState(false);
  const [capturedPhoto, setCapturedPhoto] =
    React.useState<CameraCapturedPicture | null>(null);
  const [showCamera, setShowCamera] = React.useState(true);

  const showResults = () => {
    if (task.version === 3) {
      const success = Math.random() > 0.5;
      setIsSuccess(success);
    } else {
      setIsSuccess(selectedAnswer === correctAnswer);
    }

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

  const handleSavePhoto = (photo: CameraCapturedPicture) => {
    console.log("Photo saved:", photo.uri);
    setCapturedPhoto(photo);
    // Don't close the camera view here - we want to keep showing the photo in CameraComponent
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const goToHome = () => {
    router.push("/(root)/(tabs)/Home");
  };

  const isButtonDisabled = () => {
    if (task.version === 3) {
      return capturedPhoto === null;
    } else {
      return selectedAnswer === null;
    }
  };

  const buttonStyle = selectedAnswer === correctAnswer ? "success" : "fail";

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
        onDismiss={() => setPopupVisible(false)}
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
              image={{ uri: imageUrl }}
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
        onDismiss={() => setPopupVisible(false)}
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

      {/* Always show CameraComponent, but it will internally display either the camera or the taken photo */}
      <CameraComponent
        onSavePhoto={handleSavePhoto}
        onCloseCamera={handleCloseCamera}
      />

      <View className="w-full items-center mt-5">
        <CustomButton
          marginTop={1}
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
        onDismiss={() => setPopupVisible(false)}
        buttonStyle={isSuccess ? "success" : "error"}
        taskVersion={task.version}
      />
    </View>
  ) : (
    <View className="flex-1 justify-center items-center">
      <Text className="text-lg text-grayscale-900 mb-4">
        Unknown task version
      </Text>
      <CustomButton onPress={goToHome} text="GO BACK" style="base" />
    </View>
  );
};

export default Task;
