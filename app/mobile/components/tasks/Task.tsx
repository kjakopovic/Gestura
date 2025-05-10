import { View, Image, Text, Alert } from "react-native"; // Added Alert
import React, { useEffect, useRef, useState } from "react"; // Added useRef, useState
import { CameraCapturedPicture } from "expo-camera";
// eslint-disable-next-line import/no-unresolved
import * as ort from "onnxruntime-react-native";
import { getModelPath } from "@/constants/model"; // Assuming MODEL_IMAGE_SIZE is also here or not needed directly by Task.tsx
import { createModelSession, inferenceCapturedPhoto } from "@/utils/model"; // Import new function

import AnswerBox from "./task-components/AnswerBox";
import QuestionBox from "./task-components/QuestionBox";
import TaskBox from "./task-components/TaskBox";
import CustomButton from "../CustomButton";
import ResultPopup from "./task-components/ResultPopup";

import * as characters from "@/constants/characters";
import CameraComponent from "../CameraComponent";

interface TaskProps {
  id: string;
  section: number;
  sectionName: string;
  version: number;
  question: string | number; // For v3, this is the image (e.g., hands.letter_c) or its identifier
  possibleAnswers: string[];
  correctAnswerIndex: number;
  onComplete?: () => void;
  onFailure?: () => void;
}

const Task = (task: TaskProps) => {
  const modelSessionRef = useRef<ort.InferenceSession | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false); // For v3 inference

  const handleAnswerPress = (text: string) => {
    setSelectedAnswer(text);
  };

  // For v1 and v2, correctAnswer is a string.
  // For v3, correctAnswer is the target letter string (e.g., "C") the user should sign.
  const correctAnswer = task.possibleAnswers[task.correctAnswerIndex];

  // For v3, task.question is expected to be an ImageSourcePropType (e.g., hands.letter_c)
  const correctImage =
    task.version === 2
      ? { uri: task.possibleAnswers[task.correctAnswerIndex] } // Assuming this is a URI string
      : task.version === 3
      ? (task.question as any) // Cast as any if task.question is ImageSourcePropType
      : null;

  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(
    null
  );
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [popupVisible, setPopupVisible] = React.useState(false);
  const [capturedPhoto, setCapturedPhoto] =
    React.useState<CameraCapturedPicture | null>(null);
  const [showCamera, setShowCamera] = React.useState(true); // For v3, camera is initially shown

  // Load and release model for task version 3
  useEffect(() => {
    let isActive = true;
    if (task.version === 3) {
      const loadModel = async () => {
        setIsModelLoading(true);
        try {
          const modelPath = await getModelPath();
          if (!modelPath) {
            if (isActive) Alert.alert("Error", "Task Model: Path not found.");
            setIsModelLoading(false);
            return;
          }
          const session = await createModelSession(modelPath);
          if (isActive) {
            modelSessionRef.current = session;
            console.log("Task Model: Session created for v3.");
          }
        } catch (error) {
          console.error("Task Model: Failed to load for v3", error);
          if (isActive) Alert.alert("Error", "Task Model: Failed to load.");
        } finally {
          if (isActive) setIsModelLoading(false);
        }
      };
      loadModel();
    }

    return () => {
      isActive = false;
      if (modelSessionRef.current) {
        modelSessionRef.current
          .release()
          .then(() => console.log("Task Model: Session released for v3."));
        modelSessionRef.current = null;
      }
    };
  }, [task.version]);

  const showResults = async () => {
    // Made async for v3
    if (task.version === 3) {
      if (!capturedPhoto) {
        Alert.alert("Error", "Please take a photo first.");
        return;
      }
      if (!modelSessionRef.current) {
        Alert.alert("Error", "Model not ready. Please wait or try again.");
        return;
      }
      if (isProcessingPhoto) return;

      setIsProcessingPhoto(true);
      try {
        const [predictions] = await inferenceCapturedPhoto(
          capturedPhoto,
          modelSessionRef.current
        );
        if (predictions && predictions.length > 0) {
          const predictedLetter = predictions[0].label;
          const probability = predictions[0].probability;
          console.log(
            `Task v3: Predicted: ${predictedLetter}, Prob: ${probability}, Target: ${correctAnswer}`
          );

          // Ensure correctAnswer is defined and is a string for comparison
          if (typeof correctAnswer === "string") {
            const success =
              predictedLetter.toUpperCase() === correctAnswer.toUpperCase() &&
              probability > 0.5;
            setIsSuccess(success);
          } else {
            console.error(
              "Task v3: correctAnswer is not a string for comparison."
            );
            setIsSuccess(false); // Default to failure if correctAnswer is not set up as expected
          }
        } else {
          setIsSuccess(false); // No prediction or empty prediction
          Alert.alert(
            "Verification Failed",
            "Could not verify the sign. Please try again."
          );
        }
      } catch (error) {
        console.error("Task v3: Error during inference", error);
        setIsSuccess(false);
        Alert.alert("Error", "An error occurred during verification.");
      } finally {
        setIsProcessingPhoto(false);
        setPopupVisible(true); // Show popup after processing
      }
    } else if (task.version === 2) {
      // Ensure selectedAnswer is not null and is a string before parsing
      const isCorrect =
        selectedAnswer !== null &&
        parseInt(selectedAnswer, 10) === task.correctAnswerIndex;
      setIsSuccess(isCorrect);
      setPopupVisible(true);
    } else {
      // version 1
      setIsSuccess(selectedAnswer === correctAnswer);
      setPopupVisible(true);
    }
  };

  const handleContinue = () => {
    if (popupVisible) {
      setPopupVisible(false);
      if (isSuccess && task.onComplete) {
        task.onComplete();
      } else if (!isSuccess && task.onFailure) {
        task.onFailure();
      }
    } else {
      showResults(); // This will now handle async for v3
    }
  };

  const handlePopupDismiss = () => {
    setPopupVisible(false);
    if (isSuccess && task.onComplete) {
      task.onComplete();
    } else if (!isSuccess && task.onFailure) {
      task.onFailure();
    }
  };

  const handleSavePhoto = (photo: CameraCapturedPicture) => {
    console.log("Photo saved for task v3:", photo.uri);
    setCapturedPhoto(photo);
    // setShowCamera(false);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const isButtonDisabled = () => {
    if (task.version === 3) {
      return capturedPhoto === null || isModelLoading || isProcessingPhoto;
    } else {
      return selectedAnswer === null;
    }
  };

  // For v1 and v2, buttonStyle depends on selectedAnswer.
  // For v3, buttonStyle in ResultPopup is determined by isSuccess after inference.
  const buttonStyle =
    task.version === 1
      ? selectedAnswer === correctAnswer
        ? "success"
        : "fail"
      : task.version === 2
      ? selectedAnswer !== null &&
        parseInt(selectedAnswer, 10) === task.correctAnswerIndex
        ? "success"
        : "fail"
      : "base"; // Default for v3, ResultPopup will use its own logic based on isSuccess

  return task.version === 1 ? (
    <View className="flex-1 justify-center items-start">
      <QuestionBox text="What letter does this symbol represent?" />
      <View className="w-full flex-row justify-center items-end">
        <Image className="m-8 mt-4 mb-0 w-50%" source={characters.character1} />
        <TaskBox image={task.question as any} />
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
        <TaskBox text={task.question as string} />
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
    <View className="flex-1 justify-start items-start pt-5">
      <QuestionBox text="Show me how you would sign the following:" />
      <View className="w-full flex-row justify-center items-end">
        <Image className="m-8 mt-4 mb-0 w-50%" source={characters.character1} />
        <TaskBox text={correctAnswer} image={task.question as any} />
      </View>

      <View className="w-full h-[1px] bg-grayscale-400 my-8" />

      <CameraComponent
        onSavePhoto={handleSavePhoto}
        onCloseCamera={handleCloseCamera}
      />
      {capturedPhoto && (
        <View className="w-full items-center my-2">
          <Text className="text-white">
            Photo captured! Press Continue to verify.
          </Text>
        </View>
      )}

      <View className="w-full items-center mt-5">
        <CustomButton
          noMargin
          onPress={handleContinue}
          text={
            isProcessingPhoto
              ? "VERIFYING..."
              : isModelLoading
              ? "MODEL LOADING..."
              : "CONTINUE"
          }
          style="base"
          disabled={isButtonDisabled()}
        />
      </View>

      <ResultPopup
        visible={popupVisible}
        isSuccess={isSuccess}
        correctImage={correctImage}
        onDismiss={handlePopupDismiss}
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
