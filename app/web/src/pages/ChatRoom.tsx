import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { VideoPlayer } from "@/components/common";
import { RoomContext } from "@/contexts/RoomContext";
import { PeerState } from "@/constants/peerActions";

const ChatRoom = () => {
  const { id } = useParams();
  const {
    ws,
    me,
    stream,
    peers,
    isMuted,
    setIsMuted,
    showCamera,
    setShowCamera,
    shareScreen,
    screenSharingId,
    setRoomId,
  } = useContext(RoomContext);
  const [isDeafened, setIsDeafened] = useState(false);

  useEffect(() => {
    if (me) ws.emit("join-room", { roomId: id, peerId: me.id });
  }, [id, me, ws]);

  useEffect(() => {
    setRoomId(id);
  }, [setRoomId, id]);

  const screenSharingVideo =
    screenSharingId === me?.id ? stream : peers[screenSharingId]?.stream;

  console.log("User screen sharing: ", screenSharingId);

  return (
    <>
      <div className="flex">
        {screenSharingId && (
          <div className="w-full z-0">
            <VideoPlayer stream={screenSharingVideo} />
          </div>
        )}
      </div>
      <div className="flex justify-center items-center gap-5 mb-5">
        <button onClick={() => setIsMuted((prev: boolean) => !prev)}>
          {isMuted ? "Unmute" : "Mute"}
        </button>

        <button onClick={() => setIsDeafened((prev) => !prev)}>
          {isDeafened ? "Undeafen" : "Deafen"}
        </button>

        <button onClick={() => setShowCamera((prev: boolean) => !prev)}>
          {showCamera ? "Hide camera" : "Show camera"}
        </button>

        <button onClick={shareScreen}>{"Share screen"}</button>
      </div>

      <div className={`grid gap-5 w-full grid-cols-2 z-10`}>
        <VideoPlayer stream={stream} muted={true} />

        {Object.values(peers as PeerState).map((peer, index) => (
          <div key={index}>
            <VideoPlayer stream={peer.stream} muted={isDeafened} />
            <div className="text-center text-white">{peer.peerId}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ChatRoom;
