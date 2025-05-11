import {
  BackButton,
  Button,
  ButtonType,
  VideoPlayer,
} from "@/components/common";
import { ActionButton } from "@/components/video";
import { icons } from "@/constants/icons";
import { RoomContext } from "@/contexts/RoomContext";
import { handleBack } from "@/utils/common";
import { createRoom } from "@/utils/video";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

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

  const navigate = useNavigate();

  return (
    <div className="w-full h-screen flex flex-col items-start p-10">
      <BackButton
        className="py-3 px-6"
        onClick={() => {
          handleBack(navigate);
        }}
      />
      <div className="w-full h-full flex flex-col items-center justify-center gap-7">
        {showCamera ? (
          <VideoPlayer
            stream={stream}
            muted={true}
            className="w-full md:w-[500px] rounded-2xl border border-background-400"
          />
        ) : (
          <div className="w-full md:w-[500px] h-[300px] rounded-2xl border border-background-400 bg-transparent flex flex-col gap-2 items-center justify-center">
            <p className="text-background-400">Camera is off</p>
            {isMuted && (
              <p className="text-background-400">Microphone is off</p>
            )}
          </div>
        )}
        <Button
          onClick={() => {
            createRoom(socketRef, me);
          }}
          type={ButtonType.PRIMARY_FULL}
          text="Create Room"
          styles="w-full md:w-[500px]"
        />
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
    </div>
  );
};

export default CreateRoom;
