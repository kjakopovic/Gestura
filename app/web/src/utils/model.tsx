import * as ort from "onnxruntime-web";
import {
  DETECTION_THRESHOLD,
  LABEL_MAP,
  MODEL_IMAGE_SIZE,
} from "../constants/model";

// Helper function to preprocess image for YOLO input
function preprocess(video: HTMLVideoElement): Float32Array {
  const [modelWidth, modelHeight] = MODEL_IMAGE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = modelWidth;
  canvas.height = modelHeight;
  const ctx = canvas.getContext("2d");

  // Draw video on canvas (resize)
  ctx!.drawImage(video, 0, 0, modelWidth, modelHeight);

  // Get image data
  const imageData = ctx!.getImageData(0, 0, modelWidth, modelHeight);
  const data = imageData.data;

  // YOLOv8 expects float32 input with shape [1, 3, height, width]
  // and values normalized to [0-1]
  const tensor = new Float32Array(3 * modelHeight * modelWidth);

  // ONNX expects HWC -> CHW order and normalized from 0-1
  for (let i = 0; i < modelHeight * modelWidth; i++) {
    const pos = i * 4;
    // Convert to CHW format (Channel, Height, Width)
    // R values
    tensor[i] = data[pos] / 255.0;
    // G values
    tensor[i + modelHeight * modelWidth] = data[pos + 1] / 255.0;
    // B values
    tensor[i + 2 * modelHeight * modelWidth] = data[pos + 2] / 255.0;
  }

  return tensor;
}

// Process YOLO model output for bounding boxes, classes and scores
function processOutput(
  output: any,
  imgWidth: number,
  imgHeight: number,
  confidenceThreshold = 0.25,
  iouThreshold = 0.45
) {
  // Extract output data based on your YOLO model version
  // This example is for YOLOv8 - adjust based on your specific model's output format
  const boxes = [];
  const scores = [];
  const classes = [];

  // YOLOv8 output shape depends on the number of classes
  // For a model with 80 classes, output shape is usually [1, 84, num_predictions]
  // - First 4 values are box coordinates (x, y, w, h)
  // - Next 80 values are class probabilities

  // Assuming predictions array format - adjust based on your model's output format
  const predictions = output.output0 || output[Object.keys(output)[0]];
  const data = predictions.data;
  const dimensions = predictions.dims;

  const numClasses = dimensions[1] - 4; // First 4 values are box coordinates
  const numPredictions = dimensions[2];

  // Loop through all predictions
  for (let i = 0; i < numPredictions; i++) {
    // Find highest class score for this prediction
    let maxScore = 0;
    let maxClassIndex = 0;

    for (let c = 0; c < numClasses; c++) {
      const score = data[4 + c + i * dimensions[1]];
      if (score > maxScore) {
        maxScore = score;
        maxClassIndex = c;
      }
    }

    // Only keep predictions above threshold
    if (maxScore > confidenceThreshold) {
      // Extract box coordinates (they may need to be denormalized for your model)
      const x = data[i * dimensions[1]]; // center x
      const y = data[i * dimensions[1] + 1]; // center y
      const w = data[i * dimensions[1] + 2]; // width
      const h = data[i * dimensions[1] + 3]; // height

      boxes.push([y, x, h, w]);
      scores.push(maxScore);
      classes.push(maxClassIndex);
    }
  }

  // Non-maximum suppression would typically be done here
  // For simplicity, we'll skip that but you might need to implement it

  return { boxes, scores, classes };
}

export const drawRect = (
  boxes: any,
  classes: any,
  scores: any,
  imgWidth: number,
  imgHeight: number,
  ctx: any
) => {
  for (let i = 0; i < boxes.length; i++) {
    if (
      boxes[i] &&
      classes[i] !== undefined &&
      scores[i] > DETECTION_THRESHOLD
    ) {
      // Extract variables
      const [y, x, height, width] = boxes[i];
      const text = classes[i];

      // Default color if class not in LABEL_MAP
      const color = LABEL_MAP[text]?.color || "red";
      const name = LABEL_MAP[text]?.name || `Class ${text}`;

      // Set styling
      ctx.strokeStyle = color;
      ctx.lineWidth = 10;
      ctx.fillStyle = "white";
      ctx.font = "30px Arial";

      // Draw rectangles and text
      ctx.beginPath();
      console.log("drawing: ", name);

      ctx.fillText(
        name + " - " + Math.round(scores[i] * 100) + "%",
        x * imgWidth,
        y * imgHeight - 10
      );
      ctx.rect(
        x * imgWidth,
        y * imgHeight,
        (width * imgWidth) / 2,
        (height * imgHeight) / 1.5
      );

      ctx.stroke();
    }
  }
};

export const detect = async (
  webcamRef: any,
  canvasRef: any,
  session: ort.InferenceSession // Ensure ort is used correctly
) => {
  // Ensure webcam and canvas are available
  const video = webcamRef.current?.video;
  const canvas = canvasRef.current;

  if (video && canvas && video.readyState === 4) {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Set video dimensions
    video.width = videoWidth;
    video.height = videoHeight;

    // Set canvas dimensions
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    try {
      // 1. Preprocess the image
      const inputTensor = preprocess(video);

      // 2. Create ONNX tensor
      const tensor = new ort.Tensor("float32", inputTensor, [
        // Ensure ort.Tensor is used
        1,
        3,
        MODEL_IMAGE_SIZE[1],
        MODEL_IMAGE_SIZE[0],
      ]);

      // 3. Run inference
      const feeds = { images: tensor };
      const results = await session.run(feeds); // Ensure ort.Session.run is used

      // 4. Process output to get boxes, scores, classes
      const { boxes, scores, classes } = processOutput(
        // Ensure ort.Session.run is used
        results,
        videoWidth,
        videoHeight
      );
      console.log("results: ", boxes, scores, classes);

      // 5. Draw results on canvas
      const ctx = canvas.getContext("2d");
      requestAnimationFrame(() => {
        drawRect(boxes, classes, scores, videoWidth, videoHeight, ctx);
      });
    } catch (error) {
      console.error("ONNX inference error:", error);
    }
  }
};
