import { NavigateFunction } from "react-router-dom";
import {
  ADD_PEER,
  PeerAction,
  PeerState,
  REMOVE_PEER,
} from "../constants/peerActions";

export const peersReducer = (
  state: PeerState,
  action: PeerAction
): PeerState => {
  switch (action.type) {
    case ADD_PEER:
      return {
        ...state,
        [action.payload.peerId]: {
          stream: action.payload.stream,
          peerId: action.payload.peerId,
        },
      };
    case REMOVE_PEER:
      const { [action.payload.peerId]: deleted, ...rest } = state;
      return rest;
    default:
      return { ...state };
  }
};

export const createRoom = (socketRef: any, me: any) => {
  const sock = socketRef.current;
  if (sock && sock.readyState === WebSocket.OPEN) {
    sock.send(JSON.stringify({ action: "create-room", peerId: me?.id }));
  } else {
    console.error("WebSocket is not open. Ready state:", sock?.readyState);
  }
};

export const joinRoom = (roomCode: string, navigate: NavigateFunction) => {
  if (!roomCode || roomCode === "") {
    return;
  }

  navigate(`/room/${roomCode}`);
};
