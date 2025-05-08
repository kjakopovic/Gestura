import * as ort from "onnxruntime-react-native";
import * as ImageManipulator from "expo-image-manipulator";
import { Tensor } from "onnxruntime-common";
import { decode as decodeJpeg } from "jpeg-js";
import { Buffer } from "buffer";
import { LABEL_MAP, MODEL_IMAGE_SIZE } from "@/constants/model";
import { PredictionResult } from "@/types/model";
import { CameraView } from "expo-camera";

function imageDataToTensor(image: Uint8ClampedArray, dims: number[]): Tensor {
  const [batch, channels, height, width] = dims;
  // split RGBA into R, G, B channels
  const red = new Float32Array(height * width);
  const green = new Float32Array(height * width);
  const blue = new Float32Array(height * width);

  for (let i = 0, p = 0; i < image.length; i += 4, ++p) {
    red[p] = image[i] / 255;
    green[p] = image[i + 1] / 255;
    blue[p] = image[i + 2] / 255;
  }

  // ONNX expects [N, C, H, W]
  const data = Float32Array.from([...red, ...green, ...blue]);

  return new Tensor("float32", data, dims);
}

async function runInference(
  session: ort.InferenceSession,
  tensor: Tensor
): Promise<[PredictionResult[], number]> {
  const start = Date.now();
  const feeds: Record<string, Tensor> = {
    [session.inputNames[0]]: tensor,
  };
  const outputMap = await session.run(feeds);
  const end = Date.now();

  const raw = outputMap[session.outputNames[0]];
  const scores = Array.from(raw.data as Float32Array);
  // softmax
  const exps = scores.map(Math.exp);
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / sum);
  // top5
  const top5 = probs
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p - a.p)
    .slice(0, 5);

  const results: PredictionResult[] = top5.map(({ i, p }) => ({
    class: i,
    probability: p,
    label: LABEL_MAP[i],
  }));

  return [results, (end - start) / 1000];
}

export async function inferenceCamera(
  cameraRef: React.MutableRefObject<CameraView>,
  session: ort.InferenceSession
): Promise<[PredictionResult[], number]> {
  if (!cameraRef.current) {
    return [[], 0];
  }

  // take a picture as JPEG base64
  const photo = await cameraRef.current.takePictureAsync({
    base64: true,
    skipProcessing: true,
    quality: 1,
  });

  if (!photo || !photo.base64) {
    console.error("No photo taken");
    return [[], 0];
  }

  // resize it down to MODEL_IMAGE_SIZE with expo-image-manipulator
  const resized = await ImageManipulator.manipulateAsync(
    photo.uri,
    [
      {
        resize: {
          width: MODEL_IMAGE_SIZE[0],
          height: MODEL_IMAGE_SIZE[1],
        },
      },
    ],
    { base64: true, compress: 1 }
  );

  // decode JPEG → raw RGBA
  const jpegData = Buffer.from(resized.base64!, "base64");
  const { data, width, height } = decodeJpeg(jpegData, { useTArray: true });
  // data is a Uint8Array of length W*H*4

  // convert to Uint8ClampedArray
  const rgba = new Uint8ClampedArray(data.buffer);

  // make tensor
  const tensor = imageDataToTensor(rgba, [
    1,
    3,
    MODEL_IMAGE_SIZE[1],
    MODEL_IMAGE_SIZE[0],
  ]);

  return await runInference(session, tensor);
}
