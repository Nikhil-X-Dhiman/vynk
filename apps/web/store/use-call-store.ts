import { create } from 'zustand';
import { CallUser } from '@repo/shared';

type CallState = 'idle' | 'incoming' | 'outgoing' | 'connected' | 'ended';

interface CallStore {
  callState: CallState;
  callType: 'audio' | 'video';
  caller: CallUser | null;
  callee: CallUser | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  signal?: RTCSessionDescriptionInit; // Added to store pending offer signal
  isMuted: boolean;
  isVideoEnabled: boolean;

  startCall: (callee: CallUser, type: 'audio' | 'video') => void;
  incomingCall: (caller: CallUser, type: 'audio' | 'video') => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  reset: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  callState: 'idle',
  callType: 'video',
  caller: null,
  callee: null,
  localStream: null,
  remoteStream: null,
  signal: undefined,
  isMuted: false,
  isVideoEnabled: true,

  startCall: (callee, type) => set({
    callState: 'outgoing',
    callee,
    callType: type
  }),

  incomingCall: (caller, type) => set({
    callState: 'incoming',
    caller,
    callType: type
  }),

  acceptCall: () => set({ callState: 'connected' }),

  rejectCall: () => set({ callState: 'ended' }), // Will trigger effect to notify server later

  endCall: () => set({ callState: 'ended' }),

  setLocalStream: (stream) => set({ localStream: stream }),

  setRemoteStream: (stream) => set({ remoteStream: stream }),

  toggleMute: () => set((state) => {
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach(track => {
        track.enabled = !state.isMuted; // Toggle checks state before update? No, use !state.isMuted means we are unmuting?
        // Wait, isMuted = true means audio is OFF.
        // track.enabled = true means audio is ON.
        // So track.enabled = state.isMuted (if we are currently muted, we set enabled to true).
        track.enabled = !!state.isMuted;
      });
    }
    return { isMuted: !state.isMuted };
  }),

  toggleVideo: () => set((state) => {
    if (state.localStream) {
      state.localStream.getVideoTracks().forEach(track => {
        track.enabled = !!state.isVideoEnabled; // Same logic
      });
    }
    return { isVideoEnabled: !state.isVideoEnabled };
  }),

  reset: () => set({
    callState: 'idle',
    localStream: null,
    remoteStream: null,
    caller: null,
    callee: null,
    isMuted: false,
    isVideoEnabled: true,
  }),
}));
