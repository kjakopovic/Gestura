import Peer from "peerjs";
import {
  createContext,
  FunctionComponent,
  ReactNode,
  useEffect,
  useReducer,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { addPeerAction, removePeerAction } from "@/constants/peerActions";
import { peersReducer } from "@/utils/video";

// TODO: use from .env
const WS = "http://localhost:3000";

export const RoomContext = createContext<null | any>(null);

// TODO: use normal sockets so I can connect to AWS lambda sockets (logic is the same)
// const ws = socketIO(WS);

export const RoomProvider: FunctionComponent<{ children: ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  const [me, setMe] = useState<Peer>();
  const [stream, setStream] = useState<MediaStream>();
  const [peers, dispatchPeers] = useReducer(peersReducer, {});
  const [isMuted, setIsMuted] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [screenSharingId, setScreenSharingId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  const enterRoom = ({ roomId }: { roomId: string }) => {
    navigate(`/room/${roomId}`);
  };

  const getUsers = ({ users }: { roomId: string; users: string[] }) => {
    console.log(users);
  };

  const removePeer = (peerId: string) => {
    dispatchPeers(removePeerAction(peerId));
  };

  const switchStream = (stream: MediaStream) => {
    setStream(stream);

    Object.values(me?.connections || {}).forEach((connection: any) => {
      const videoTrack = stream?.getVideoTracks()[0];
      connection[0].peerConnection.getSenders()[1].replaceTrack(videoTrack);
    });
  };

  const shareScreen = () => {
    if (screenSharingId) {
      // Stop screen sharing: revert back to the camera stream.
      setScreenSharingId("");
      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then(switchStream)
        .catch((err) => console.error("Error switching back to camera:", err));
    } else {
      // Start screen sharing.
      setScreenSharingId(me?.id || "");
      navigator.mediaDevices
        .getDisplayMedia({ video: true })
        .then((displayStream) => {
          // Listen for the user stopping the share using the browser's native UI.
          displayStream.getVideoTracks()[0].onended = () => {
            setScreenSharingId("");
            navigator.mediaDevices
              .getUserMedia({ video: true, audio: true })
              .then(switchStream)
              .catch((err) =>
                console.error(
                  "Error switching back to camera after screen share ended:",
                  err
                )
              );
          };
          switchStream(displayStream);
        })
        .catch((err) => console.error("Error sharing screen:", err));
    }
  };

  useEffect(() => {
    const peerId = uuid();
    const peer = new Peer(peerId, {
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          {
            urls: "turn:your-turn-server.com",
            username: "user",
            credential: "pass",
          },
        ],
      },
    });
    setMe(peer);

    try {
      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then((stream) => {
          setStream(stream);
        });
    } catch (error) {
      console.log(error);
    }

    ws.on("room-created", enterRoom);
    ws.on("get-users", getUsers);
    ws.on("user-disconnected", removePeer);
    ws.on("user-started-sharing", (peerId: string) =>
      setScreenSharingId(peerId)
    );
    ws.on("user-stopped-sharing", () => setScreenSharingId(""));

    return () => {
      ws.off("room-created");
      ws.off("get-users");
      ws.off("user-disconnected");
      ws.off("user-started-sharing");
      ws.off("user-stopped-sharing");
    };
  }, []);

  useEffect(() => {
    if (!roomId) return;

    // Only emit start-sharing if this client is the one sharing.
    if (me?.id === screenSharingId) {
      ws.emit("start-sharing", { roomId: roomId, peerId: me.id });
    }
    // Optionally, if no one is sharing, emit stop-sharing.
    else if (!screenSharingId) {
      ws.emit("stop-sharing", roomId);
    }
  }, [screenSharingId, roomId, me, ws]);

  useEffect(() => {
    if (!me || !stream) return;

    // Update media track states
    stream.getVideoTracks().forEach((track) => {
      track.enabled = showCamera;
    });
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });

    // Handler for when another user joins
    const handleUserJoined = ({ peerId }: { peerId: string }) => {
      const call = me.call(peerId, stream);
      call.on("stream", (peerStream) => {
        dispatchPeers(addPeerAction(peerId, peerStream));
      });
    };

    // Handler for incoming calls
    const handleCall = (call: any) => {
      call.answer(stream);
      call.on("stream", (peerStream: MediaStream) => {
        dispatchPeers(addPeerAction(call.peer, peerStream));
      });
    };

    ws.on("user-joined", handleUserJoined);
    me.on("call", handleCall);

    return () => {
      ws.off("user-joined", handleUserJoined);
      me.off("call", handleCall);
    };
  }, [me, stream, isMuted, showCamera]);

  return (
    <RoomContext.Provider
      value={{
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
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
