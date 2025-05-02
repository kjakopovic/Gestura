import { Button, ButtonType } from "@/components/common";
import { RoomContext } from "@/contexts/RoomContext";
import { useContext } from "react";

const CreateRoom = () => {
  const { socketRef } = useContext(RoomContext);

  const createRoom = () => {
    const sock = socketRef.current;
    if (sock && sock.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify({ action: "create-room" }));
    } else {
      console.error("WebSocket is not open. Ready state:", sock?.readyState);
    }
  };

  return (
    <div>
      <Button
        onClick={createRoom}
        type={ButtonType.SECONDARY_FULL}
        text="Create Room"
        styles="mt-10"
      />
    </div>
  );
};

export default CreateRoom;
