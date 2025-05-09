declare module "onnxruntime-react-native" {
  import type {
    Tensor,
    InferenceSession as OrtSession,
    InferenceSessionSingleton as OrtSessionSingleton,
    SessionOptions as OrtSessionOptions,
  } from "onnxruntime-common";

  export interface SessionOptions extends OrtSessionOptions {
    executionProviders?: string[];
    executionProviderOptions?: {
      cpuexecutionprovider?: {
        useArena?: boolean;
        threadCount?: number;
      };
      // Add other provider options as needed
    };
  }

  export type InferenceSession = OrtSession;

  export const InferenceSession: {
    create(
      model: string | Uint8Array,
      options?: SessionOptions
    ): Promise<InferenceSession>;
  };

  export type InferenceSessionSingleton = OrtSessionSingleton;
  export type Tensor = Tensor;

  // Add any other exports you need
}
