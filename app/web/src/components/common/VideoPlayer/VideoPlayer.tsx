import { useEffect, useRef } from "react";

interface Props {
  stream: MediaStream;
  muted?: boolean;
}

const VideoPlayer = ({ stream, muted }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={muted}
      className="bg-black w-full h-[300px]"
    ></video>
  );
};

export default VideoPlayer;
