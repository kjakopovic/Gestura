import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface Props {
  stream: MediaStream;
  muted?: boolean;
  className?: string;
}

const VideoPlayer = ({ stream, muted, className }: Props) => {
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
    <div
      className={cn(
        "rounded-xl overflow-hidden w-full h-[300px] z-10",
        className
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        muted={muted}
        className={"w-full h-full object-cover bg-transparent"}
      />
    </div>
  );
};

export default VideoPlayer;
