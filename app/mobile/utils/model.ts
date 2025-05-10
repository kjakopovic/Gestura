import { InferenceSession } from "onnxruntime-react-native";
import { Tensor } from "onnxruntime-common";
import * as ImageManipulator from "expo-image-manipulator";
import { decode as decodeJpeg } from "jpeg-js";
import { Buffer } from "buffer";

import { LABEL_MAP, MODEL_IMAGE_SIZE } from "@/constants/model";
import { PredictionResult } from "@/types/model";
import { CameraView } from "expo-camera";
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

      executionProviderOptions: {
        cpuexecutionprovider: {
          useArena: true,
          threadCount: 2, // TODO: possible to improve performance if we can read how many threads are available on users device
        },
      },

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
    if (!session) {
      console.error("No valid session provided");
      return [[], 0];
    }

    if (!session.inputNames || !session.inputNames[0]) {
      console.error("Session has no valid input names");
      return [[], 0];
    }

    if (!session.outputNames || !session.outputNames[0]) {
      console.error("Session has no valid output names");
      return [[], 0];
    }

    if (!cameraRef.current.takePictureAsync) {
      console.error("Camera doesn't have takePictureAsync method");
      return [[], 0];
    }

    const startTime = Date.now();

    // 1) Snap a JPEG with base64
    const photo = await cameraRef.current.takePictureAsync({
      base64: true,
      skipProcessing: true,
      quality: 0.3, // TODO: check if this is now faster, moved quality from 0.8 to 0.3 (also check quality of predictions)
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

    // Decode JPEG from base64
    const imageBuffer = Buffer.from(photo.base64, "base64");

    const decodedImage = decodeJpeg(imageBuffer, { useTArray: true });

    if (!decodedImage || !decodedImage.data) {
      console.error("Failed to decode JPEG image or get pixel data.");
      return [[], 0];
    }
    // decodedImage.data is Uint8Array (RGBA), width, height

    // TODO: removed this because our images are 224x224 (check if it is faster now)
    // Resize if necessary (using expo-image-manipulator)
    // const manipResult = await ImageManipulator.manipulateAsync(
    //   photo.uri, // Use the original URI for manipulation
    //   [
    //     {
    //       resize: {
    //         width: MODEL_IMAGE_SIZE[0],
    //         height: MODEL_IMAGE_SIZE[1],
    //       },
    //     },
    //   ],
    //   {
    //     compress: 1,
    //     format: ImageManipulator.SaveFormat.JPEG, // Keep as JPEG for consistency
    //     base64: true, // We need base64 again for the *resized* image
    //   }
    // );

    // Re-decode the *resized* image's base64
    // const resizedImageBuffer = Buffer.from(photo.base64, "base64");
    // const resizedDecodedImage = decodeJpeg(resizedImageBuffer, {
    //   useTArray: true,
    // });

    // if (!resizedDecodedImage || !resizedDecodedImage.data) {
    //   console.error("Failed to decode resized JPEG image.");
    //   return [[], 0];
    // }
    const rgba = new Uint8ClampedArray(
      decodedImage.data.buffer,
      decodedImage.data.byteOffset,
      decodedImage.data.length
    );

    // Convert RGBA to Tensor
    const inputTensor = imageDataToTensor(
      rgba,
      MODEL_IMAGE_SIZE[0],
      MODEL_IMAGE_SIZE[1]
    );

    // Perform Inference
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

    // Process Output: Find the class with the highest score
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

    if (predictedIndex !== -1) {
      const predictedLabel = LABEL_MAP[predictedIndex] || "Unknown";

      predictions.push({
        class: predictedIndex,
        label: predictedLabel,
        probability: maxScore,
      });
    } else {
      console.warn("Could not determine a prediction from the model output.");
    }

    const inferenceTime = Date.now() - startTime;

    return [predictions, inferenceTime];
  } catch (error) {
    console.error("Error in inferenceCamera (caught):", error);

    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }

    return [[], 0];
  }
}
