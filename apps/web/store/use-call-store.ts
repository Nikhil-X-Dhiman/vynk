/**
 * @fileoverview Call Management Store
 *
 * Manages WebRTC call state including call lifecycle, media streams,
 * and user controls (mute/video toggle). Supports both audio and video calls.
 *
 * @module store/use-call-store
 *
 * @example
 * ```tsx
 * import { useCallStore } from '@/store';
 *
 * function CallControls() {
 *   const { callState, isMuted, toggleMute, endCall } = useCallStore();
 *
 *   if (callState === 'idle') return null;
 *
 *   return (
 *     <div>
 *       <button onClick={toggleMute}>
 *         {isMuted ? 'Unmute' : 'Mute'}
 *       </button>
 *       <button onClick={endCall}>End Call</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { create } from 'zustand';
import type { CallUser } from '@repo/shared';

// ==========================================
// Types
// ==========================================

/**
 * Possible states of a call.
 * - `idle`: No active call
 * - `incoming`: Receiving a call
 * - `outgoing`: Initiating a call
 * - `connected`: Call is active
 * - `ended`: Call has ended (transitional state)
 */
export type CallState =
  | 'idle'
  | 'incoming'
  | 'outgoing'
  | 'connected'
  | 'ended';

/**
 * Type of call being made.
 */
export type CallType = 'audio' | 'video';

/**
 * State managed by the call store.
 */
export interface CallStoreState {
  /** Current state of the call lifecycle */
  callState: CallState;
  /** Type of call (audio or video) */
  callType: CallType;
  /** User who initiated the call (for incoming calls) */
  caller: CallUser | null;
  /** User being called (for outgoing calls) */
  callee: CallUser | null;
  /** Local user's media stream */
  localStream: MediaStream | null;
  /** Remote user's media stream */
  remoteStream: MediaStream | null;
  /** Pending WebRTC offer signal */
  pendingSignal: RTCSessionDescriptionInit | null;
  /** Whether the local microphone is muted */
  isMuted: boolean;
  /** Whether the local camera is enabled */
  isVideoEnabled: boolean;
}

/**
 * Actions available in the call store.
 */
export interface CallStoreActions {
  /** Initiates an outgoing call */
  startCall: (callee: CallUser, type: CallType) => void;
  /** Handles an incoming call */
  incomingCall: (
    caller: CallUser,
    type: CallType,
    signal?: RTCSessionDescriptionInit,
  ) => void;
  /** Accepts an incoming call */
  acceptCall: () => void;
  /** Rejects an incoming call */
  rejectCall: () => void;
  /** Ends the current call */
  endCall: () => void;
  /** Sets the local media stream */
  setLocalStream: (stream: MediaStream | null) => void;
  /** Sets the remote media stream */
  setRemoteStream: (stream: MediaStream | null) => void;
  /** Sets a pending WebRTC signal */
  setPendingSignal: (signal: RTCSessionDescriptionInit | null) => void;
  /** Toggles microphone mute state */
  toggleMute: () => void;
  /** Toggles camera enabled state */
  toggleVideo: () => void;
  /** Resets all call state to initial values */
  reset: () => void;
}

/**
 * Complete call store type combining state and actions.
 */
export interface CallStore extends CallStoreState, CallStoreActions {}

// ==========================================
// Initial State
// ==========================================

/**
 * Default call state when no call is active.
 */
const initialState: CallStoreState = {
  callState: 'idle',
  callType: 'video',
  caller: null,
  callee: null,
  localStream: null,
  remoteStream: null,
  pendingSignal: null,
  isMuted: false,
  isVideoEnabled: true,
};

// ==========================================
// Store Definition
// ==========================================

/**
 * Call management store for WebRTC calls.
 *
 * Features:
 * - Full call lifecycle management
 * - Media stream handling
 * - Mute/video toggle with proper track management
 * - Signal storage for call setup
 */
export const useCallStore = create<CallStore>((set) => ({
  // Initial state
  ...initialState,

  /**
   * Starts an outgoing call to the specified user.
   */
  startCall: (callee: CallUser, type: CallType) => {
    set({
      callState: 'outgoing',
      callee,
      callType: type,
      caller: null,
    });
  },

  /**
   * Handles an incoming call from another user.
   */
  incomingCall: (
    caller: CallUser,
    type: CallType,
    signal?: RTCSessionDescriptionInit,
  ) => {
    set({
      callState: 'incoming',
      caller,
      callType: type,
      callee: null,
      pendingSignal: signal || null,
    });
  },

  /**
   * Accepts the current incoming call.
   */
  acceptCall: () => {
    set({ callState: 'connected' });
  },

  /**
   * Rejects the current incoming call.
   */
  rejectCall: () => {
    set({ callState: 'ended' });
  },

  /**
   * Ends the current active call.
   */
  endCall: () => {
    set({ callState: 'ended' });
  },

  /**
   * Sets the local media stream.
   */
  setLocalStream: (stream: MediaStream | null) => {
    set({ localStream: stream });
  },

  /**
   * Sets the remote media stream.
   */
  setRemoteStream: (stream: MediaStream | null) => {
    set({ remoteStream: stream });
  },

  /**
   * Stores a pending WebRTC signal for call setup.
   */
  setPendingSignal: (signal: RTCSessionDescriptionInit | null) => {
    set({ pendingSignal: signal });
  },

  /**
   * Toggles the microphone mute state.
   */
  toggleMute: () => {
    set((state) => {
      const newMutedState = !state.isMuted;

      if (state.localStream) {
        state.localStream.getAudioTracks().forEach((track) => {
          track.enabled = !newMutedState;
        });
      }

      return { isMuted: newMutedState };
    });
  },

  /**
   * Toggles the camera enabled state.
   */
  toggleVideo: () => {
    set((state) => {
      const newVideoState = !state.isVideoEnabled;

      if (state.localStream) {
        state.localStream.getVideoTracks().forEach((track) => {
          track.enabled = newVideoState;
        });
      }

      return { isVideoEnabled: newVideoState };
    });
  },

  /**
   * Resets all call state to initial values.
   */
  reset: () => {
    set(initialState);
  },
}));
