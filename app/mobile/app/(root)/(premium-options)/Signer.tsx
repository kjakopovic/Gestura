import { View, Text, Alert } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import CustomButton from "@/components/CustomButton";
import { useRouter } from "expo-router";
import { Camera, CameraView, useCameraPermissions } from "expo-camera";
//eslint-disable-next-line import/no-unresolved
import * as ort from "onnxruntime-react-native";
import { DETECTION_INTERVAL_MS, MODEL_IMAGE_SIZE } from "@/constants/model";
import { inferenceCamera, getModelPath } from "@/utils/model";

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
  const [, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      console.log("Camera permission status:", status);
    })();
  }, []);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    // Track if effect is still active
    let isActive = true;
    let intervalId: NodeJS.Timeout | null = null;

    const setupDetection = async () => {
      console.log("Starting ASL model setup...");
      console.log("Camera ready state:", cameraReady);
      console.log("Camera ref state:", !!cameraRef?.current);

      if (!cameraReady || !cameraRef.current) {
        console.log("Camera not ready yet, will try again when ready");
        return;
      }

      try {
        const ASL_MODEL_PATH = await getModelPath();
        console.log("Model path loaded:", !!ASL_MODEL_PATH);

        // Create session and WAIT for it to be ready
        const session = await ort.InferenceSession.create(ASL_MODEL_PATH!, {
          executionProviders: ["cpu"],
          //@ts-ignore
          graphOptimizationLevel: "all",
        });

        if (!isActive) return;

        modelSessionRef.current = session;
        console.log("ASL model session created successfully");

        // Start detection interval AFTER model is loaded
        let isProcessing = false;

        intervalId = setInterval(() => {
          if (
            isProcessing ||
            !modelSessionRef.current ||
            !cameraRef.current ||
            !cameraReady
          ) {
            return;
          }

          isProcessing = true;

          // Use promise instead of async/await in interval callback
          inferenceCamera(cameraRef, modelSessionRef.current)
            .then((predictions) => {
              if (predictions && predictions.length > 0) {
                // Check that predictions is properly defined before accessing
                if (!predictions || !Array.isArray(predictions)) {
                  console.log("No valid predictions received");
                  return;
                }

                console.log("Predictions received:", predictions.length);

                if (predictions.length > 0) {
                  const letter = predictions[0].label;
                  if (letter === "NOTHING") {
                    return;
                  }

                  const now = Date.now();

                  const seenRecently = lastLettersRef.current.includes(letter);
                  const tooSoon = now - lastSentTimeRef.current < 1000;

                  if (!seenRecently || (seenRecently && !tooSoon)) {
                    setSpokenLetters((prev) => [...prev, letter]);
                    lastSentTimeRef.current = now;

                    console.log("Detected letter:", letter);
                    console.log("Spoken letters:", [
                      ...lastLettersRef.current,
                      letter,
                    ]);

                    lastLettersRef.current.push(letter);
                    if (lastLettersRef.current.length > 2) {
                      lastLettersRef.current.shift();
                    }
                  }
                } else {
                  console.log("No predictions found");
                }
              }
            })
            .catch((error) => {
              console.error("Inference error:", error.message);
            })
            .finally(() => {
              setTimeout(() => {
                isProcessing = false;
              }, 100);
            });
        }, DETECTION_INTERVAL_MS);

        detectIntervalRef.current = intervalId;
        console.log("Detection interval started");
      } catch (error) {
        console.error("Failed to set up ASL model:", error);
      }
    };

    setupDetection();

    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
        console.log("Detection interval cleared");
      }

      // Add this block to properly release the model
      if (modelSessionRef.current) {
        modelSessionRef.current
          .release()
          .then(() => console.log("Signer: Model session released"))
          .catch((err) =>
            console.error("Signer: Error releasing model session:", err)
          );
        modelSessionRef.current = null;
      }

      detectIntervalRef.current = null;
    };
  }, [cameraReady, permission?.granted]);

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
          style={{
            width: MODEL_IMAGE_SIZE[0],
            height: MODEL_IMAGE_SIZE[1],
          }}
          pictureSize={`${MODEL_IMAGE_SIZE[0]}x${MODEL_IMAGE_SIZE[1]}`}
          facing={"front"}
          ref={cameraRef}
          onCameraReady={() => {
            setTimeout(() => {
              setCameraReady(true);
            }, 100);
          }}
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
          onPress={() => router.replace("/(root)/(tabs)/Premium")}
        />
      </View>
    </View>
  );
};

export default Signer;
