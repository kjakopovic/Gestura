import { View } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import * as ort from "onnxruntime-react-native";
import {
  ASL_MODEL_PATH,
  DETECTION_INTERVAL_MS,
  MODEL_IMAGE_SIZE,
} from "@/constants/model";
import { CameraView } from "expo-camera";
import { inferenceCamera } from "@/utils/model";

const CustomerSupport = () => {
  const modelSessionRef = useRef<ort.InferenceSession | null>(null);
  const detectIntervalRef = useRef<number | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const lastLettersRef = useRef<string[]>([]);
  const lastSentTimeRef = useRef<number>(0);

  const [spokenLetters, setSpokenLetters] = useState<string[]>([]);
  const [cameraReady, setCameraReady] = useState<boolean>(false);

  useEffect(() => {
    if (!cameraReady || !cameraRef || cameraRef === null) return;

    ort.InferenceSession.create(ASL_MODEL_PATH, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    })
      .then((session) => {
        modelSessionRef.current = session;
      })
      .catch(console.error);

    detectIntervalRef.current = window.setInterval(async () => {
      const [predictions] = await inferenceCamera(
        cameraRef,
        modelSessionRef.current!
      );
      if (predictions.length === 0) return;

      const letter = predictions[0].label;
      const now = Date.now();

      const seenRecently = lastLettersRef.current.includes(letter);
      const tooSoon = now - lastSentTimeRef.current < 1000;

      if (!seenRecently || (seenRecently && !tooSoon)) {
        setSpokenLetters((prev) => [...prev, letter]);
        lastSentTimeRef.current = now;

        console.log("Detected letter:", letter);
        console.log("Spoken letters:", spokenLetters);

        lastLettersRef.current.push(letter);
        if (lastLettersRef.current.length > 2) {
          lastLettersRef.current.shift();
        }
      }
    }, DETECTION_INTERVAL_MS);

    return () => {
      if (detectIntervalRef.current) {
        clearInterval(detectIntervalRef.current);
      }
    };
  }, [cameraReady]);

  return (
    <View>
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
        onCameraReady={() => setCameraReady(true)}
      />
    </View>
  );
};

export default CustomerSupport;
