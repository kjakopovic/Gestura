import { View, Text, Alert } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import CustomButton from "@/components/CustomButton";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
//eslint-disable-next-line import/no-unresolved
import * as ort from "onnxruntime-react-native";
import { DETECTION_INTERVAL_MS, getModelPath } from "@/constants/model";
import { inferenceCamera, createModelSession } from "@/utils/model";

// This should ideally match MODEL_IMAGE_SIZE[0] and MODEL_IMAGE_SIZE[1]
const CAMERA_PREVIEW_SIZE = 224;

const Signer = () => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  const modelSessionRef = useRef<ort.InferenceSession | null>(null);
  const detectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLettersRef = useRef<string[]>([]); // To avoid spamming the same letter
  const lastSentTimeRef = useRef<number>(0);
  const [spokenLetters, setSpokenLetters] = useState<string[]>([]);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Effect for model setup and inference loop
  useEffect(() => {
    let isActive = true; // Track if effect is still active to prevent updates on unmounted component
    let intervalId: NodeJS.Timeout | null = null;

    const setupDetection = async () => {
      if (!cameraReady || !cameraRef.current || !permission?.granted) {
        return;
      }

      try {
        const modelPath = await getModelPath();
        if (!modelPath) {
          if (isActive)
            Alert.alert("Error", "Could not load translation model.");
          return;
        }

        const session = await createModelSession(modelPath);
        if (!isActive) return;

        modelSessionRef.current = session;

        let isProcessing = false;
        intervalId = setInterval(async () => {
          if (
            !isActive ||
            isProcessing ||
            !modelSessionRef.current ||
            !cameraRef.current ||
            !cameraReady
          ) {
            return;
          }

          isProcessing = true;

          try {
            const [predictions] = await inferenceCamera(
              cameraRef,
              modelSessionRef.current
            );

            if (!isActive) {
              isProcessing = false;
              return;
            }

            if (predictions && predictions.length > 0) {
              const letter = predictions[0].label;
              const probability = predictions[0].probability;
              const now = Date.now();

              // Basic filtering: high confidence and avoid rapid duplicates
              const seenRecently = lastLettersRef.current.includes(letter);
              const tooSoon = now - lastSentTimeRef.current < 1000; // 1 second cooldown

              if (
                probability > 0.7 &&
                (!seenRecently || (seenRecently && !tooSoon))
              ) {
                setSpokenLetters((prev) => [...prev, letter]);
                lastSentTimeRef.current = now;

                lastLettersRef.current.push(letter);
                if (lastLettersRef.current.length > 3) {
                  // Keep track of last few letters
                  lastLettersRef.current.shift();
                }
              }
            }
          } catch (error) {
            console.error("Signer: Inference error inside interval:", error);
          } finally {
            if (isActive) isProcessing = false;
          }
        }, DETECTION_INTERVAL_MS);

        detectIntervalRef.current = intervalId;
      } catch (error) {
        console.error("Signer: Failed to set up ASL model:", error);
        if (isActive)
          Alert.alert("Error", "Failed to initialize translation model.");
      }
    };

    if (permission?.granted && cameraReady) {
      setupDetection();
    }

    // Cleanup function
    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      detectIntervalRef.current = null;
      if (modelSessionRef.current) {
        modelSessionRef.current
          .release()
          .catch((e) =>
            console.error("Signer: Error releasing model session", e)
          );
        modelSessionRef.current = null;
      }
    };
  }, [cameraReady, permission?.granted]); // Re-run if cameraReady or permission status changes

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-grayscale-800">
        <Text className="text-white">Loading permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-grayscale-800 p-4">
        <Text className="text-white text-center mb-4">
          We need your permission to show the camera for translation.
        </Text>
        <CustomButton
          onPress={requestPermission}
          text="Grant Permission"
          style="base"
        />
        <CustomButton
          text="CLOSE TRANSLATOR"
          style="error"
          onPress={() => router.push("/(root)/(tabs)/Premium")}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-grayscale-800">
      <Text className="text-white text-xl font-interExtraBold mb-4 mt-12">
        Sign to translate
      </Text>
      <View
        className="flex flex-col justify-center items-center border-2 border-grayscale-400 mt-4 rounded-xl overflow-hidden"
        style={{ width: CAMERA_PREVIEW_SIZE, height: CAMERA_PREVIEW_SIZE }}
      >
        <CameraView
          ref={cameraRef}
          style={{ width: CAMERA_PREVIEW_SIZE, height: CAMERA_PREVIEW_SIZE }}
          facing={"front"}
          onCameraReady={() => {
            setCameraReady(true);
          }}
          // onError={(error) => console.error("Signer: Camera error:", error.nativeEvent?.message || error)}
        />
      </View>
      <View className="flex-1 w-full px-6 py-4 mt-4">
        <Text className="text-white text-lg font-interSemiBold mb-2">
          Translation:
        </Text>
        <View className="bg-grayscale-700 p-3 rounded-lg min-h-[100px] border border-grayscale-400">
          <Text className="text-white text-xl font-inter">
            {spokenLetters.join(" ")}
          </Text>
        </View>
      </View>
      <View className="pb-4 w-full px-6">
        <CustomButton
          text="SWITCH TO TALKER"
          style="base"
          onPress={() => {
            Alert.alert("Coming Soon", "This feature is not available yet", [
              { text: "OK", onPress: () => {} },
            ]);
          }}
        />
        <CustomButton
          text="CLOSE TRANSLATOR"
          style="error"
          onPress={() => router.push("/(root)/(tabs)/Premium")}
        />
      </View>
    </View>
  );
};

export default Signer;
