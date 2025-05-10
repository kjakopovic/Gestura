import { InferenceSession } from "onnxruntime-react-native";
import { Tensor } from "onnxruntime-common";
import { Asset } from "expo-asset";
import * as ImageManipulator from "expo-image-manipulator";
import { decode as decodeJpeg } from "jpeg-js";
import { Buffer } from "buffer";

import { LABEL_MAP, MODEL_IMAGE_SIZE } from "@/constants/model";
import { PredictionResult } from "@/types/model";
import { CameraView, CameraCapturedPicture } from "expo-camera";

global.Buffer = Buffer;

export const getModelPath = async (): Promise<string> => {
  const modelAsset = Asset.fromModule(require("../assets/models/asl.onnx"));
  await modelAsset.downloadAsync();
  if (!modelAsset.localUri) {
    throw new Error("ONNX model asset failed to download or resolve its URI");
  }
  return modelAsset.localUri;
};

export const createModelSession = async (
  modelPath: string
): Promise<InferenceSession> => {
  try {
    const session = await InferenceSession.create(modelPath, {
      executionProviders: ["cpu"],
      //@ts-ignore
      graphOptimizationLevel: "all",
    });
    console.log("Model loaded with CPU execution provider");
    return session;
  } catch (e) {
    console.error("Failed to create inference session:", e);
    throw e;
  }
};

/**
 * Decode a JPEG base64 string, resize it, and convert to NCHW Float32 Tensor.
 */
async function prepareTensorFromUri(uri: string): Promise<Tensor> {
  const { base64 } = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MODEL_IMAGE_SIZE[0], height: MODEL_IMAGE_SIZE[1] } }],
    { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  if (!base64) throw new Error("Failed to get base64 from manipulated image");

  const buffer = Buffer.from(base64, "base64");
  const decoded = decodeJpeg(buffer, { useTArray: true });
  if (!decoded.data) throw new Error("Failed to decode manipulated JPEG data");

  const pixels = new Uint8ClampedArray(
    decoded.data.buffer,
    decoded.data.byteOffset,
    decoded.data.length
  );
  const num = MODEL_IMAGE_SIZE[0] * MODEL_IMAGE_SIZE[1];
  const data = new Float32Array(num * 3);

  for (let i = 0; i < num; i++) {
    data[i] = pixels[i * 4] / 255; // R
    data[num + i] = pixels[i * 4 + 1] / 255; // G
    data[2 * num + i] = pixels[i * 4 + 2] / 255; // B
  }

  return new Tensor("float32", data, [
    1,
    3,
    MODEL_IMAGE_SIZE[1],
    MODEL_IMAGE_SIZE[0],
  ]);
}

// Get the top K classes from the softmax output
const imagenetClassesTopK = (softmaxArray: number[], k: number) => {
  return softmaxArray
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .slice(0, k);
};

// The softmax function is used to convert the output of the model to probabilities.
// (transforms values to be between 0 and 1)
const softmax = (arr: number[]): number[] => {
  const expValues = arr.map((value) => Math.exp(value));
  const sumExpValues = expValues.reduce((a, b) => a + b, 0);
  return expValues.map((value) => value / sumExpValues);
};

const runInference = async (
  session: InferenceSession,
  preprocessedData: Tensor
): Promise<PredictionResult[]> => {
  // create feeds with the input name from model export and the preprocessed data.
  const feeds: Record<string, Tensor> = {};
  feeds[session.inputNames[0]] = preprocessedData;

  // Run the session inference.
  const outputData = await session.run(feeds);

  // Get output results with the output name from the model export.
  const output = outputData[session.outputNames[0]];

  // Get the softmax of the output data.
  const outputSoftmax = softmax(Array.prototype.slice.call(output.data));

  const results = imagenetClassesTopK(outputSoftmax, 5);

  // Convert the results to a more readable format.
  const resultsFormatted = results.map((result: any) => {
    return {
      class: result.index,
      probability: result.value,
      label: LABEL_MAP[result.index],
    };
  });

  return resultsFormatted;
};

export async function inferenceCamera(
  cameraRef: React.MutableRefObject<CameraView | null>,
  session: InferenceSession
): Promise<PredictionResult[]> {
  if (!cameraRef.current) {
    console.error("Camera ref is null");
    return [];
  }

  try {
    const photo = await cameraRef.current.takePictureAsync({
      skipProcessing: true,
      quality: 0.5,
    });
    if (!photo?.uri) throw new Error("Failed to capture photo");

    const tensor = await prepareTensorFromUri(photo.uri);
    const results = await runInference(session, tensor);

    return results;
  } catch (e) {
    console.error("inferenceCamera error:", e);
    return [];
  }
}

export async function inferenceCapturedPhoto(
  photo: CameraCapturedPicture,
  session: InferenceSession
): Promise<PredictionResult[]> {
  if (!photo?.uri) {
    console.error("inferenceCapturedPhoto: Missing photo URI");
    return [];
  }

  try {
    const tensor = await prepareTensorFromUri(photo.uri);
    const results = await runInference(session, tensor);

    return results;
  } catch (e) {
    console.error("inferenceCapturedPhoto error:", e);
    return [];
  }
}
