import React, { useEffect, useRef, useState } from "react";
import * as ort from "onnxruntime-react-native";
import {
  DETECTION_INTERVAL_MS,
  getModelPath,
  MODEL_IMAGE_SIZE,
} from "@/constants/model";
import { CameraView } from "expo-camera";
import { inferenceCamera } from "@/utils/model";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from "expo-camera";

const CustomerSupport = () => {
  const modelSessionRef = useRef<ort.InferenceSession | null>(null);
  const detectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const lastLettersRef = useRef<string[]>([]);
  const lastSentTimeRef = useRef<number>(0);

  const [spokenLetters, setSpokenLetters] = useState<string[]>([]);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      console.log("Camera permission status:", status);
    })();
  }, []);

  useEffect(() => {
    let isActive = true; // Track if effect is still active
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

        if (!isActive) return; // Check if component unmounted during async operation

        modelSessionRef.current = session;
        console.log("ASL model session created successfully");

        // Start detection interval AFTER model is loaded
        let isProcessing = false; // Prevent overlapping processing

        const SAFER_INTERVAL = 500; // 500ms instead of 16.7ms

        intervalId = setInterval(() => {
          // Skip if already processing or model/camera not ready
          if (
            isProcessing ||
            !modelSessionRef.current ||
            !cameraRef.current ||
            !cameraReady
          ) {
            return; // Don't log this - it will spam the console
          }

          isProcessing = true;

          // Use promise instead of async/await in interval callback
          inferenceCamera(cameraRef, modelSessionRef.current)
            .then(([predictions]) => {
              if (predictions && predictions.length > 0) {
                // Check that predictions is properly defined before accessing
                if (!predictions || !Array.isArray(predictions)) {
                  console.log("No valid predictions received");
                  return;
                }

                console.log("Predictions received:", predictions.length);

                if (predictions.length > 0) {
                  const letter = predictions[0].label;
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
                }
              }
            })
            .catch((error) => {
              console.error("Inference error:", error.message);
            })
            .finally(() => {
              // Add a small delay before processing again
              setTimeout(() => {
                isProcessing = false;
              }, 100);
            });
        }, SAFER_INTERVAL);

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
      detectIntervalRef.current = null;
    };
  }, [cameraReady]);

  return (
    <SafeAreaView className="w-full h-full bg-white">
      <CameraView
        style={{
          width: MODEL_IMAGE_SIZE[0],
          height: MODEL_IMAGE_SIZE[1],
          zIndex: 20,
          paddingBottom: 20,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "flex-end",
        }}
        facing={"front"}
        ref={cameraRef}
        onCameraReady={() => {
          console.log("Camera reports ready");
          // Add a small delay to ensure camera is truly ready
          setTimeout(() => {
            setCameraReady(true);
          }, 500);
        }}
      />
    </SafeAreaView>
  );
};

export default CustomerSupport;
