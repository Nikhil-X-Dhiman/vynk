export interface CallUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface CallOfferPayload {
  caller: CallUser;
  calleeId: string;
  signal: RTCSessionDescriptionInit; // Offer SDP
  callType: 'audio' | 'video';
}

export interface CallAnswerPayload {
  callerId: string;
  callee: CallUser;
  signal: RTCSessionDescriptionInit; // Answer SDP
}

export interface IceCandidatePayload {
  targetUserId: string;
  candidate: RTCIceCandidate;
}

export interface CallEndPayload {
  targetUserId: string;
}

export const CALL_EVENTS = {
  OFFER: 'call:offer',
  ANSWER: 'call:answer',
  ICE_CANDIDATE: 'call:ice-candidate',
  REJECT: 'call:reject',
  END: 'call:end',
} as const;
