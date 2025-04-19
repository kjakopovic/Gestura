import React, { useRef, useEffect } from "react";
import * as ort from "onnxruntime-web";

import Webcam from "react-webcam";
import { inferenceYolo } from "@/utils/model";
import { DETECTION_INTERVAL_MS, MODEL_IMAGE_SIZE } from "@/constants/model";

const WebCam: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const sessionRef = useRef<ort.InferenceSession | null>(null);

  useEffect(() => {
    let intervalId: number;

    const runModel = async () => {
      sessionRef.current = await ort.InferenceSession.create(
        "/yolo/yolo11n-cls.onnx",
        { executionProviders: ["wasm"], graphOptimizationLevel: "all" }
      );

      intervalId = window.setInterval(async () => {
        if (sessionRef.current) {
          var [result, time] = await inferenceYolo(
            webcamRef,
            sessionRef.current
          );
          console.log("result: ", result);
          console.log("time: ", time);
        }
      }, DETECTION_INTERVAL_MS);
    };

    runModel();

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          muted={true}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: MODEL_IMAGE_SIZE[0],
            height: MODEL_IMAGE_SIZE[1],
          }}
        />
      </header>
    </div>
  );
};

export default WebCam;
