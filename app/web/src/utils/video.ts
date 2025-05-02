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
