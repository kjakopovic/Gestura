export const ADD_PEER = "ADD_PEER";
export const REMOVE_PEER = "REMOVE_PEER";

export type PeerState = Record<string, { stream: MediaStream; peerId: string }>;

export type PeerAction =
  | { type: typeof ADD_PEER; payload: { peerId: string; stream: MediaStream } }
  | { type: typeof REMOVE_PEER; payload: { peerId: string } };

export const addPeerAction = (
  peerId: string,
  stream: MediaStream
): PeerAction => {
  return {
    type: ADD_PEER,
    payload: { peerId, stream },
  };
};

export const removePeerAction = (peerId: string): PeerAction => {
  return {
    type: REMOVE_PEER,
    payload: { peerId },
  };
};
