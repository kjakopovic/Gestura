import { Button, ButtonType, VideoPlayer } from "@/components/common";
import { ActionButton } from "@/components/video";
import { icons } from "@/constants/icons";
import { RoomContext } from "@/contexts/RoomContext";
import { useContext } from "react";

const CreateRoom = () => {
  const {
    socketRef,
    me,
    isMuted,
    setIsMuted,
    showCamera,
    setShowCamera,
    stream,
  } = useContext(RoomContext);

  const createRoom = () => {
    const sock = socketRef.current;
    if (sock && sock.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify({ action: "create-room", peerId: me?.id }));
    } else {
      console.error("WebSocket is not open. Ready state:", sock?.readyState);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-7">
      <Button
        onClick={createRoom}
        type={ButtonType.PRIMARY_FULL}
        text="Create Room"
        styles="mt-10"
      />
      {showCamera ? (
        <VideoPlayer
          stream={stream}
          muted={true}
          className="w-full md:w-[500px] rounded-none md:rounded-2xl border border-background-400"
        />
      ) : (
        <div className="w-full md:w-[500px] h-[300px] rounded-none md:rounded-2xl border border-background-400 bg-transparent flex flex-col gap-2 items-center justify-center">
          <p className="text-background-400">Camera is off</p>
          {isMuted && <p className="text-background-400">Microphone is off</p>}
        </div>
      )}
      <div className="w-full flex flex-row items-center justify-center gap-4">
        <ActionButton
          icon={icons.mic}
          active={!isMuted}
          onClick={() => setIsMuted((prev: boolean) => !prev)}
        />
        <ActionButton
          icon={icons.camera}
          active={showCamera}
          onClick={() => setShowCamera((prev: boolean) => !prev)}
        />
      </div>
    </div>
  );
};

export default CreateRoom;
