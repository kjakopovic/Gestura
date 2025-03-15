import { LabelMap } from "../types/model";

export const MODEL_IMAGE_SIZE = [640, 480];

export const DETECTION_THRESHOLD = 0.7;

export const DETECTION_INTERVAL_MS = 16.7;

export const MODEL_PATH = "/model/model.json";

export const LABEL_MAP: LabelMap = {
  1: { name: "K", color: "red" },
  2: { name: "O", color: "yellow" },
  3: { name: "V", color: "orange" },
};
