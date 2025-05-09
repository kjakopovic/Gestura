// utils/model.ts
import {
  InferenceSession,
  InferenceSessionSingleton,
} from "onnxruntime-react-native";
import { Tensor } from "onnxruntime-common";
import * as ImageManipulator from "expo-image-manipulator";
import { decode as decodeJpeg } from "jpeg-js";
import { Buffer } from "buffer"; // ❷

import { LABEL_MAP, MODEL_IMAGE_SIZE } from "@/constants/model";
import { PredictionResult } from "@/types/model";
import { CameraView } from "expo-camera"; // ❶
global.Buffer = Buffer;

/**
 * Turn a flat RGBA array into an NCHW Float32 tensor.
 */
function imageDataToTensor(
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): Tensor {
  const numPixels = width * height;
  const data = new Float32Array(numPixels * 3);

  for (let i = 0; i < numPixels; i++) {
    const r = rgba[i * 4] / 255;
    const g = rgba[i * 4 + 1] / 255;
    const b = rgba[i * 4 + 2] / 255;
    data[i] = r; // R channel
    data[numPixels + i] = g; // G channel
    data[2 * numPixels + i] = b; // B channel
  }

  // dims = [batch, channels, height, width]
  return new Tensor("float32", data, [1, 3, height, width]);
}

/**
 * Create session with CPU execution provider
 */
export const createModelSession = async (
  modelPath: string
): Promise<InferenceSession> => {
  try {
    // Explicitly use CPU execution provider
    const session = await InferenceSession.create(modelPath, {
      executionProviders: ["cpuexecutionprovider"],
      // Optional: CPU thread configuration
      executionProviderOptions: {
        cpuexecutionprovider: {
          useArena: true,
          threadCount: 2, // Adjust based on device capabilities
        },
      },
      // Optional performance tuning
      //@ts-ignore
      graphOptimizationLevel: "all",
      intraOpNumThreads: 2,
      interOpNumThreads: 2,
    });

    console.log("Model loaded with CPU execution provider");
    return session;
  } catch (error) {
    console.error("Failed to create inference session:", error);
    throw error;
  }
};

/**
 * Takes a cameraRef and a pre-created session,
 * snaps a frame, resizes it, turns it into a tensor,
 * and runs inference.
 */
export async function inferenceCamera(
  cameraRef: React.MutableRefObject<CameraView | null>,
  session: InferenceSession
): Promise<[PredictionResult[], number]> {
  if (!cameraRef.current) {
    console.error("Camera ref is null");
    return [[], 0];
  }

  try {
    // Before using session
    if (!session) {
      console.error("No valid session provided");
      return [[], 0];
    }

    // Before accessing session.inputNames
    if (!session.inputNames || !session.inputNames[0]) {
      console.error("Session has no valid input names");
      return [[], 0];
    }

    // And similar checks for outputNames
    if (!session.outputNames || !session.outputNames[0]) {
      console.error("Session has no valid output names");
      return [[], 0];
    }

    // Check if takePictureAsync exists
    if (!cameraRef.current.takePictureAsync) {
      console.error("Camera doesn't have takePictureAsync method");
      return [[], 0];
    }

    const startTime = Date.now();

    // 1) Snap a JPEG with base64
    const photo = await cameraRef.current.takePictureAsync({
      base64: true,
      skipProcessing: true, // We'll handle processing
      quality: 0.8, // Adjust quality as needed, 1 is highest
      // Consider adding exif: false if you don't need EXIF data
    });

    if (!photo) {
      console.error("takePictureAsync call failed, returned undefined.");
      return [[], 0];
    }

    if (typeof photo.base64 !== "string" || photo.base64.length === 0) {
      console.error(
        "Photo captured, but base64 data is missing, not a string, or empty. URI:",
        photo.uri
      );
      return [[], 0];
    }

    // 2) Decode JPEG from base64
    // The Buffer.from is crucial for jpeg-js
    const imageBuffer = Buffer.from(photo.base64, "base64");
    const decodedImage = decodeJpeg(imageBuffer, { useTArray: true }); // useTArray for Uint8Array

    if (!decodedImage || !decodedImage.data) {
      console.error("Failed to decode JPEG image or get pixel data.");
      return [[], 0];
    }
    // decodedImage.data is Uint8Array (RGBA), width, height

    // 3) Resize if necessary (using expo-image-manipulator)
    //    Note: If your camera already provides images at MODEL_IMAGE_SIZE,
    //    you might skip or adjust this.
    //    For this example, let's assume we need to resize.
    const manipResult = await ImageManipulator.manipulateAsync(
      photo.uri, // Use the original URI for manipulation
      [
        {
          resize: {
            width: MODEL_IMAGE_SIZE[0],
            height: MODEL_IMAGE_SIZE[1],
          },
        },
      ],
      {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG, // Keep as JPEG for consistency
        base64: true, // We need base64 again for the *resized* image
      }
    );

    if (!manipResult || !manipResult.base64) {
      console.error("Image manipulation failed or did not return base64.");
      return [[], 0];
    }

    // Re-decode the *resized* image's base64
    const resizedImageBuffer = Buffer.from(manipResult.base64, "base64");
    const resizedDecodedImage = decodeJpeg(resizedImageBuffer, {
      useTArray: true,
    });

    if (!resizedDecodedImage || !resizedDecodedImage.data) {
      console.error("Failed to decode resized JPEG image.");
      return [[], 0];
    }
    const rgba = new Uint8ClampedArray(
      resizedDecodedImage.data.buffer,
      resizedDecodedImage.data.byteOffset,
      resizedDecodedImage.data.length
    );

    // 4) Convert RGBA to Tensor
    const inputTensor = imageDataToTensor(
      rgba,
      MODEL_IMAGE_SIZE[0], // Use model's expected width
      MODEL_IMAGE_SIZE[1] // Use model's expected height
    );

    // 5) Perform Inference
    const feeds: Record<string, Tensor> = {};
    feeds[session.inputNames[0]] = inputTensor;

    const outputData = await session.run(feeds);
    const outputTensor = outputData[session.outputNames[0]];

    if (!outputTensor || !outputTensor.data) {
      console.error(
        "Inference did not produce a valid output tensor or output tensor data is missing."
      );
      return [[], 0];
    }

    // 6) Process Output: Find the class with the highest score
    const predictions: PredictionResult[] = [];
    const outputArray = outputTensor.data as Float32Array;

    if (outputArray.length === 0) {
      console.warn("Model output array is empty.");
      return [[], 0];
    }

    // Find the index of the highest score
    let maxScore = -Infinity;
    let predictedIndex = -1;

    for (let i = 0; i < outputArray.length; i++) {
      if (outputArray[i] > maxScore) {
        maxScore = outputArray[i];
        predictedIndex = i;
      }
    }

    // console.log("Model output dimensions:", outputTensor.dims);
    // console.log("Model output array (scores):", Array.from(outputArray));
    // console.log(`Highest score: ${maxScore} at index: ${predictedIndex}`);

    if (predictedIndex !== -1) {
      const predictedLabel = LABEL_MAP[predictedIndex] || "Unknown";
      // Optional: Add a confidence threshold
      // const CONFIDENCE_THRESHOLD = 0.5;
      // if (maxScore >= CONFIDENCE_THRESHOLD) {
      //   predictions.push({ label: predictedLabel, score: maxScore });
      // } else {
      //   // Handle low confidence, e.g., predict "NOTHING" or return empty
      // }
      predictions.push({ label: predictedLabel, score: maxScore });
    } else {
      console.warn("Could not determine a prediction from the model output.");
    }

    const inferenceTime = Date.now() - startTime;
    // console.log(`Inference time: ${inferenceTime}ms, Predictions:`, predictions);

    return [predictions, inferenceTime];
  } catch (error) {
    console.error("Error in inferenceCamera (caught):", error);
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    return [[], 0];
  }
}
