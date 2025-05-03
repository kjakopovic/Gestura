import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, ButtonType, VideoPlayer } from "@/components/common";
import { RoomContext } from "@/contexts/RoomContext";
import { PeerState } from "@/constants/peerActions";
import { ActionButton } from "@/components/video";
import { icons } from "@/constants/icons";
import { APP_ROUTES } from "@/constants/common";

const ChatRoom = () => {
  const { id } = useParams();
  const {
    socketRef,
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
  const navigate = useNavigate();

  const [isDeafened, setIsDeafened] = useState(false);
  const [signer, setSigner] = useState<boolean>(false);

  useEffect(() => {
    const sock = socketRef.current;
    if (!me || !sock) return;

    const sendJoin = () => {
      sock.send(
        JSON.stringify({
          action: "join-room",
          roomId: id!,
          peerId: me.id,
        })
      );
    };

    // If it’s already open, send immediately
    if (sock.readyState === WebSocket.OPEN) {
      sendJoin();
    } else {
      // otherwise wait for open
      sock.addEventListener("open", sendJoin);
    }

    // cleanup listener on unmount or deps change
    return () => {
      sock.removeEventListener("open", sendJoin);
    };
  }, [id, me, socketRef]);

  useEffect(() => {
    setRoomId(id);
  }, [setRoomId, id]);

  const screenSharingVideo =
    screenSharingId === me?.id ? stream : peers[screenSharingId]?.stream;

  return (
    <div className="w-full h-screen flex flex-row">
      <div className="w-[65%] h-full">
        <div className="flex">
          {screenSharingId && (
            <div className="w-full z-0">
              <VideoPlayer stream={screenSharingVideo} />
            </div>
          )}
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
      </div>
      <div className="w-[35%] h-full p-10 flex flex-col items-center justify-between">
        <Button
          type={ButtonType.PRIMARY_FULL}
          text={signer ? "Signer" : "Talker"}
          onClick={() => {
            setSigner((prev) => !prev);
          }}
          styles="w-full"
        />
        <div className="flex flex-col gap-5 w-full">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton
              icon={icons.mic}
              active={!isMuted}
              onClick={() => setIsMuted((prev: boolean) => !prev)}
              className="w-full"
            />
            <ActionButton
              icon={icons.camera}
              active={showCamera}
              onClick={() => setShowCamera((prev: boolean) => !prev)}
              className="w-full"
            />
            <ActionButton
              icon={icons.cc}
              active={screenSharingId}
              onClick={shareScreen}
              className="w-full"
            />
            <ActionButton
              icon={icons.headphones}
              active={!isDeafened}
              onClick={() => setIsDeafened((prev: boolean) => !prev)}
              className="w-full"
            />
          </div>
          <ActionButton
            icon={icons.dial_icon}
            active={false}
            onClick={() => navigate(APP_ROUTES.MAIN_PAGE)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
