import * as ort from "onnxruntime-web";
import { LABEL_MAP, MODEL_IMAGE_SIZE } from "@/constants/model";
import { PredictionResult } from "@/types/model";
import Webcam from "react-webcam";

const imageDataToTensor = (
  image: Uint8ClampedArray,
  dims: number[]
): ort.Tensor => {
  // 1. Create R, G, and B arrays
  const redArray: number[] = [];
  const greenArray: number[] = [];
  const blueArray: number[] = [];

  // 2. Loop through the image data and extract the R, G, and B channels
  // The Uint8ClampedArray contains [R,G,B,A,R,G,B,A,...] values
  for (let i = 0; i < image.length; i += 4) {
    redArray.push(image[i]); // R value
    greenArray.push(image[i + 1]); // G value
    blueArray.push(image[i + 2]); // B value
    // Skip image[i + 3] which is the alpha channel
  }

  // 3. Concatenate RGB to transpose [H, W, 3] -> [3, H, W] to a number array
  const transposedData = redArray.concat(greenArray).concat(blueArray);

  // 4. Convert to float32
  const float32Data = new Float32Array(dims[1] * dims[2] * dims[3]);
  for (let i = 0; i < transposedData.length; i++) {
    float32Data[i] = transposedData[i] / 255.0; // Normalize to [0, 1]
  }

  // 5. Create the tensor object from onnxruntime-web
  const inputTensor = new ort.Tensor("float32", float32Data, dims);
  return inputTensor;
};

const getImageTensorForPicture = async (
  image: Uint8ClampedArray<ArrayBufferLike>,
  dims: number[] = [1, 3, 224, 224]
): Promise<ort.Tensor> => {
  return imageDataToTensor(image, dims);
};

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
  session: ort.InferenceSession,
  preprocessedData: ort.Tensor
): Promise<[PredictionResult[], number]> => {
  // Get start time to calculate inference time.
  const start = new Date();

  // create feeds with the input name from model export and the preprocessed data.
  const feeds: Record<string, ort.Tensor> = {};
  feeds[session.inputNames[0]] = preprocessedData;
  // Run the session inference.
  const outputData = await session.run(feeds);

  // Get the end time to calculate inference time.
  const end = new Date();
  // Convert to seconds.
  const inferenceTime = (end.getTime() - start.getTime()) / 1000;

  // Get output results with the output name from the model export.
  const output = outputData[session.outputNames[0]];
  // Get the softmax of the output data.
  const outputSoftmax = softmax(Array.prototype.slice.call(output.data));

  const results = imagenetClassesTopK(outputSoftmax, 5);

  // Convert the results to a more readable format.
  const resultsFormatted = results.map((result) => {
    return {
      class: result.index,
      probability: result.value,
      label: LABEL_MAP[result.index],
    };
  });

  return [resultsFormatted, inferenceTime];
};

const runModel = async (
  preprocessedData: ort.Tensor,
  session: ort.InferenceSession
): Promise<[PredictionResult[], number]> => {
  return await runInference(session, preprocessedData);
};

export const inferenceYolo = async (
  webcamRef: React.RefObject<Webcam | null>,
  session: ort.InferenceSession
): Promise<[PredictionResult[], number]> => {
  const video = webcamRef.current?.video;
  if (!video) {
    return [[], 0];
  }

  const modelW = MODEL_IMAGE_SIZE[0];
  const modelH = MODEL_IMAGE_SIZE[1];

  // Draw the video frame into an offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = modelW;
  canvas.height = modelH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, modelW, modelH);
  const { data } = ctx.getImageData(0, 0, modelW, modelH);

  // 1. Convert image to tensor
  const imageTensor = await getImageTensorForPicture(data);
  // 2. Run model
  const [predictions, inferenceTime] = await runModel(imageTensor, session);
  // 3. Return predictions and the amount of time it took to inference.
  return [predictions, inferenceTime];
};
