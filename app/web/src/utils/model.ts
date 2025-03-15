import {
  DETECTION_THRESHOLD,
  LABEL_MAP,
  MODEL_IMAGE_SIZE,
} from "../constants/model";
import * as tf from "@tensorflow/tfjs";

export const drawRect = (
  boxes: any,
  classes: any,
  scores: any,
  imgWidth: number,
  imgHeight: number,
  ctx: any
) => {
  for (let i = 0; i < boxes.length; i++) {
    if (boxes[i] && classes[i] && scores[i] > DETECTION_THRESHOLD) {
      // Extract variables
      const [y, x, height, width] = boxes[i];
      const text = classes[i];

      // Set styling
      ctx.strokeStyle = LABEL_MAP[text]["color"];
      ctx.lineWidth = 10;
      ctx.fillStyle = "white";
      ctx.font = "30px Arial";

      // Draw rectangles and text
      ctx.beginPath();
      console.log("drawing: ", LABEL_MAP[text]["name"]);

      ctx.fillText(
        LABEL_MAP[text]["name"] + " - " + Math.round(scores[i] * 100) + "%",
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

export const detect = async (webcamRef: any, canvasRef: any, model: any) => {
  // Ensure the video and canvas are available
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

    const img = tf.browser.fromPixels(video);
    const resized = tf.image.resizeBilinear(img, [
      MODEL_IMAGE_SIZE[0],
      MODEL_IMAGE_SIZE[1],
    ]);
    const casted = resized.cast("int32");
    const expanded = casted.expandDims(0);

    const obj = await model.executeAsync(expanded);

    const boxes = await obj[2].array();
    const classes = await obj[6].array();
    const scores = await obj[0].array();

    // Get the canvas context for drawing
    const ctx = canvas.getContext("2d");

    requestAnimationFrame(() => {
      drawRect(boxes[0], classes[0], scores[0], videoWidth, videoHeight, ctx);
    });

    tf.dispose(img);
    tf.dispose(resized);
    tf.dispose(casted);
    tf.dispose(expanded);
    tf.dispose(obj);
  }
};
