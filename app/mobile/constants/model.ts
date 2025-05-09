import { LabelMap } from "@/types/model";
import { Asset } from "expo-asset";

export const MODEL_IMAGE_SIZE = [224, 224];
export const DETECTION_THRESHOLD = 0.7;
export const DETECTION_INTERVAL_MS = 16.7;

export const getModelPath = async () => {
  const modelAsset = Asset.fromModule(require("../assets/models/asl.onnx"));
  await modelAsset.downloadAsync();
  return modelAsset.localUri;
};

export const LABEL_MAP: LabelMap = {
  0: "A",
  1: "B",
  2: "C",
  3: "D",
  4: "E",
  5: "F",
  6: "G",
  7: "H",
  8: "I",
  9: "J",
  10: "K",
  11: "L",
  12: "M",
  13: "N",
  14: "NOTHING",
  15: "O",
  16: "P",
  17: "Q",
  18: "R",
  19: "S",
  20: "T",
  21: "U",
  22: "V",
  23: "W",
  24: "X",
  25: "Y",
  26: "Z",
};
