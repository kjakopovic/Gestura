declare module "onnxruntime-react-native" {
  import type {
    Tensor as OrtTensor,
    InferenceSession as OrtSession,
  } from "onnxruntime-common";

  export type InferenceSession = OrtSession;

  // Re-export any helpers you use
  export function InferenceSession_create(
    model: string | Uint8Array,
    options?: any
  ): Promise<OrtSession>;
  // Or, if the default export is a class:
  export const InferenceSession: {
    create(model: string | Uint8Array, options?: any): Promise<OrtSession>;
  };
}
