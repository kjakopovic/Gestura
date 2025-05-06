import Peer, { DataConnection } from "peerjs";
import {
  FunctionComponent,
  ReactNode,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { addPeerAction, removePeerAction } from "@/constants/peerActions";
import { peersReducer } from "@/utils/video";
import { useAuth } from "@/hooks/useAuth";
import { RoomContext } from "./RoomContext";

const WS = import.meta.env.VITE_WSS_API;
const STAGE = import.meta.env.VITE_STAGE;
if (!WS || !STAGE) {
  throw new Error("Please setup your .env file");
}

export const RoomProvider: FunctionComponent<{ children: ReactNode }> = ({
  children,
}) => {
  const dataConns = useRef<{
    [roomId: string]: { [peerId: string]: DataConnection };
  }>({});

  const navigate = useNavigate();
  const auth = useAuth();

  const [me, setMe] = useState<Peer>();
  const [stream, setStream] = useState<MediaStream>();
  const [peers, dispatchPeers] = useReducer(peersReducer, {});
  const [isMuted, setIsMuted] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [screenSharingId, setScreenSharingId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  // ref to hold our WebSocket instance
  const socketRef = useRef<WebSocket | null>(null);

  // helper to send JSON messages
  const send = (action: string, payload: any) => {
    const sock = socketRef.current;
    if (sock && sock.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify({ action, ...payload }));
    }
  };

  const sendText = (text: string) => {
    const conns = dataConns.current[roomId] || {};
    Object.values(conns).forEach(
      (conn) => conn.open && conn.send({ type: "chat", text })
    );
  };

  const handleIncomingText = (msg: any) => {
    if (msg.type === "chat" && typeof msg.text === "string") {
      console.log("Chat from peer:", msg.text);
      // if you want to speak it:
      if ("speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(msg.text);
        utter.lang = "hr-HR";
        window.speechSynthesis.speak(utter);
      }
    }
  };

  const enterRoom = (roomId: string) => {
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
  }, []);

  useEffect(() => {
    const sock = new WebSocket(
      `${WS}/${STAGE}?x-access-token=${auth?.authState.token}`
    );
    socketRef.current = sock;

    sock.onopen = () => {
      console.log("WebSocket connected");
    };

    sock.onmessage = (evt) => {
      let msg;
      try {
        msg = JSON.parse(evt.data);
      } catch {
        return;
      }

      console.log("WebSocket message", msg);

      switch (msg.action) {
        case "room-created":
          console.log("Room created", msg);
          enterRoom(msg.roomId);
          break;
        case "get-users":
          getUsers(msg);
          break;
        case "user-disconnected":
          removePeer(msg.peerId);
          break;
        case "user-started-sharing":
          setScreenSharingId(msg.peerId);
          break;
        case "user-stopped-sharing":
          setScreenSharingId("");
          break;
        default:
          console.warn("Unknown WS action", msg);
      }
    };

    sock.onerror = (err) => console.error("WS error", err);
    sock.onclose = () => console.log("WebSocket closed");

    return () => {
      sock.close();
    };
  }, [auth?.authState.token]);

  useEffect(() => {
    if (!roomId || !me) return;

    if (me.id === screenSharingId) {
      send("start-sharing", { roomId });
    } else if (screenSharingId === "") {
      send("stop-sharing", { roomId });
    }
  }, [screenSharingId, roomId, me]);

  useEffect(() => {
    if (!me || !stream || !roomId) return;

    // Update media track states
    stream.getVideoTracks().forEach((track) => {
      track.enabled = showCamera;
    });
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });

    const handleUserJoined = ({ peerId }: { peerId: string }) => {
      // Setup video connection
      const call = me.call(peerId, stream);
      call.on("stream", (peerStream) => {
        dispatchPeers(addPeerAction(peerId, peerStream));
      });

      // Setup data transfer connection
      const conn = me.connect(peerId);
      conn.on("open", () => {
        dataConns.current[roomId] = dataConns.current[roomId] || {};
        dataConns.current[roomId][peerId] = conn;
        conn.on("data", handleIncomingText);
      });
    };

    const handleCall = (call: any) => {
      // Listen to video stream
      call.answer(stream);
      call.on("stream", (peerStream: MediaStream) => {
        dispatchPeers(addPeerAction(call.peer, peerStream));
      });

      // Listen to data transfer
      me.on("connection", (conn: DataConnection) => {
        dataConns.current[roomId] = dataConns.current[roomId] || {};
        dataConns.current[roomId][conn.peer] = conn;
        conn.on("data", handleIncomingText);
      });
    };

    // these fire off from our onmessage switch above
    socketRef.current?.addEventListener("message", (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.action === "user-joined") handleUserJoined(msg);
    });
    me.on("call", handleCall);

    return () => {
      me.off("call", handleCall);
    };
  }, [me, stream, isMuted, showCamera, roomId]);

  return (
    <RoomContext.Provider
      value={{
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
        sendText,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
