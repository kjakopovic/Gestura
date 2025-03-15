import React, { useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import Webcam from "react-webcam";
import { detect } from "../utils/model";
import {
  DETECTION_INTERVAL_MS,
  MODEL_IMAGE_SIZE,
  MODEL_PATH,
} from "../constants/model";

const WebCam: React.FC = () => {
  // Annotate the ref types:
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let intervalId: number;

    const runModel = async () => {
      const model = await tf.loadGraphModel(MODEL_PATH);

      intervalId = window.setInterval(() => {
        detect(webcamRef, canvasRef, model);
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

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 10,
            width: MODEL_IMAGE_SIZE[0],
            height: MODEL_IMAGE_SIZE[1],
          }}
        />
      </header>
    </div>
  );
};

export default WebCam;
