/**
 * Call Events - WebRTC signaling events
 */
export const CALL_EVENTS = {
  OFFER: 'call:offer',
  ANSWER: 'call:answer',
  ICE_CANDIDATE: 'call:ice-candidate',
  REJECT: 'call:reject',
  END: 'call:end',
} as const;

export type CallEvent = (typeof CALL_EVENTS)[keyof typeof CALL_EVENTS];

// =============================================================================
// Call Types
// =============================================================================

export type CallType = 'audio' | 'video';

export type CallUser = {
  id: string;
  name: string;
  avatar?: string;
};

export type CallOfferPayload = {
  caller: CallUser;
  calleeId: string;
  signal: RTCSessionDescriptionInit;
  callType: CallType;
};

export type CallAnswerPayload = {
  callerId: string;
  callee: CallUser;
  signal: RTCSessionDescriptionInit;
};

export type IceCandidatePayload = {
  targetUserId: string;
  candidate: RTCIceCandidate;
};

export type CallEndPayload = {
  targetUserId: string;
};
