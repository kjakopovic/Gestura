import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, ButtonType, VideoPlayer } from "@/components/common";
import { RoomContext } from "@/contexts/RoomContext";
import { PeerState } from "@/constants/peerActions";
import { ActionButton } from "@/components/video";
import { icons } from "@/constants/icons";
import { APP_ROUTES } from "@/constants/common";
import useMediaQuery from "@/hooks/useMediaQuery";
import * as ort from "onnxruntime-web";
import Webcam from "react-webcam";
import {
  ASL_MODEL_PATH,
  DETECTION_INTERVAL_MS,
  MODEL_IMAGE_SIZE,
} from "@/constants/model";
import { inferenceYolo } from "@/utils/model";

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
    sendText,
    isDeafened,
    setIsDeafened,
  } = useContext(RoomContext);
  const navigate = useNavigate();

  const modelSessionRef = useRef<ort.InferenceSession | null>(null);
  const detectIntervalRef = useRef<number | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const lastLettersRef = useRef<string[]>([]);
  const lastSentTimeRef = useRef<number>(0);
  const didMountRef = useRef(false);

  const [signer, setSigner] = useState<boolean>(false);

  useEffect(() => {
    ort.InferenceSession.create(ASL_MODEL_PATH, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    })
      .then((session) => {
        modelSessionRef.current = session;
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    // On first render, we just flip the flag and bail out…
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    // if we’re turning off “Signer”, clear the loop
    if (!signer) {
      console.log("Stopping detection loop");
      if (detectIntervalRef.current) {
        console.log("Clearing interval");
        clearInterval(detectIntervalRef.current);
        detectIntervalRef.current = null;
      }
      return;
    }

    // otherwise start a new interval
    detectIntervalRef.current = window.setInterval(async () => {
      const [predictions] = await inferenceYolo(
        webcamRef,
        modelSessionRef.current!
      );
      if (predictions.length === 0) return;

      const letter = predictions[0].label;
      const now = Date.now();

      const seenRecently = lastLettersRef.current.includes(letter);
      const tooSoon = now - lastSentTimeRef.current < 1000;

      if (!seenRecently || (seenRecently && !tooSoon)) {
        console.log("Detected letter:", letter);
        lastSentTimeRef.current = now;
        sendText(letter);

        lastLettersRef.current.push(letter);
        if (lastLettersRef.current.length > 2) {
          lastLettersRef.current.shift();
        }
      }
    }, DETECTION_INTERVAL_MS);

    return () => {
      if (detectIntervalRef.current) {
        clearInterval(detectIntervalRef.current);
      }
    };
  }, [signer, sendText]);

  useEffect(() => {
    const sock = socketRef.current;
    if (!me) return;

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

  const IS_SMALL = useMediaQuery("(max-width: 1100px)");

  const screenSharingVideo =
    screenSharingId === me?.id ? stream : peers[screenSharingId]?.stream;

  return (
    <div className="w-full h-screen flex flex-row">
      <div className="w-[65%] h-full p-2 md:p-5 flex flex-col gap-2">
        {screenSharingId && !IS_SMALL ? (
          <>
            <div className="w-full flex-shrink-0 relative z-0">
              <VideoPlayer
                stream={screenSharingVideo}
                className="w-full h-auto rounded-xl overflow-hidden"
              />
              <div className="absolute bottom-4 left-1/2 w-full -translate-x-1/2 flex flex-row gap-4 px-4 py-2 overflow-x-auto z-10">
                <div className="flex-shrink-0 w-[300px]">
                  <VideoPlayer
                    stream={stream}
                    muted={true}
                    className="w-full h-full rounded-lg overflow-hidden"
                  />
                </div>
                {Object.values(peers as PeerState).map((peer) => (
                  <div key={peer.peerId} className="flex-shrink-0 w-[300px]">
                    <VideoPlayer
                      stream={peer.stream}
                      muted={isDeafened}
                      className="w-full h-full rounded-lg overflow-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-5 w-full grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 z-10">
            <VideoPlayer
              stream={stream}
              muted={true}
              className="w-full h-auto"
            />
            {Object.values(peers as PeerState).map((peer, index) => (
              <div key={index}>
                <VideoPlayer
                  stream={peer.stream}
                  muted={isDeafened}
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="w-[35%] h-full p-2 md:p-10 flex flex-col items-center justify-between">
        <div className="w-full flex flex-col gap-5">
          <Button
            type={ButtonType.PRIMARY_FULL}
            text={signer ? "Signer" : "Talker"}
            onClick={() => {
              setSigner((prev) => !prev);
            }}
            styles="w-full px-4 md:px-15"
          />
          {signer && (
            <Webcam
              ref={webcamRef}
              audio={false}
              style={{
                width: MODEL_IMAGE_SIZE[0],
                height: MODEL_IMAGE_SIZE[1],
              }}
            />
          )}
        </div>
        <div className="flex flex-col gap-5 w-full">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
