import {
  BackButton,
  Button,
  ButtonType,
  Typography,
  TypographyType,
} from "@/components/common";
import { handleBack } from "@/utils/common";
import { joinRoom } from "@/utils/video";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinRoom = () => {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState("");

  return (
    <div className="w-full h-screen flex flex-col items-start p-10">
      <BackButton
        className="py-3 px-6"
        onClick={() => {
          handleBack(navigate);
        }}
      />
      <div className="w-full h-screen flex flex-col items-center justify-center gap-[100px]">
        <div className="w-full flex flex-col items-center justify-center gap-4">
          <Typography
            type={TypographyType.LANDING_SUBTITLE}
            text="Room Code"
            styles="text-background-300"
          />
          <input
            type="text"
            placeholder="Enter your room code here"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="w-2/3 text-white bg-transparent border-0 border-b-2 border-yellow-400 
              focus:outline-none focus:ring-0 placeholder-gray-400 text-lg pb-2"
          />
        </div>
        <Button
          onClick={() => {
            joinRoom(roomCode, navigate);
          }}
          type={ButtonType.PRIMARY_FULL}
          text="Join Room"
          styles="w-[200px]"
        />
      </div>
    </div>
  );
};

export default JoinRoom;
