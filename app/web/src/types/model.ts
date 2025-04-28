export interface LabelMap {
  [key: number]: string;
}

export interface PredictionResult {
  class: number;
  probability: number;
  label: string;
}
