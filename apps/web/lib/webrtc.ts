/**
 * @fileoverview WebRTC Manager
 *
 * Manages WebRTC peer connections for audio/video calls. Handles
 * offer/answer negotiation, ICE candidate exchange, and media streams.
 *
 * @module lib/webrtc
 *
 * @example
 * ```ts
 * import { webRTCManager } from '@/lib/webrtc';
 * import { getSocket } from '@/lib/services/socket';
 *
 * // Initialize with socket
 * webRTCManager.initialize(getSocket());
 *
 * // Start an outgoing call
 * const offer = await webRTCManager.startCall('user-123', 'video');
 *
 * // Accept an incoming call
 * const answer = await webRTCManager.acceptCall(incomingPayload);
 *
 * // End the call
 * webRTCManager.endCall('user-123');
 * ```
 */

import {
  CALL_EVENTS,
  CallOfferPayload,
  CallAnswerPayload,
  IceCandidatePayload,
  CallType,
} from '@repo/shared';
import { Socket } from 'socket.io-client';
import { useCallStore } from '@/store/use-call-store';

// ==========================================
// Configuration
// ==========================================

/**
 * ICE server configuration for STUN/TURN servers.
 * Uses public Google and Twilio STUN servers for NAT traversal.
 */
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

// ==========================================
// Types
// ==========================================

/**
 * Result of starting or accepting a call.
 */
export interface CallResult {
  success: boolean;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  error?: Error;
}

// ==========================================
// WebRTC Manager Class
// ==========================================

/**
 * Singleton manager for WebRTC peer connections.
 *
 * Responsibilities:
 * - Creating and managing RTCPeerConnection
 * - Handling local and remote media streams
 * - ICE candidate negotiation
 * - Offer/answer exchange
 */
class WebRTCManager {
  /** Active peer connection */
  private peerConnection: RTCPeerConnection | null = null;

  /** Socket.IO client for signaling */
  private socket: Socket | null = null;

  /** Local user's media stream */
  private localStream: MediaStream | null = null;

  /** Target user ID for current call */
  private targetUserId: string | null = null;

  // ==========================================
  // Initialization
  // ==========================================

  /**
   * Initializes the WebRTC manager with a socket instance.
   * Must be called before starting or accepting calls.
   *
   * @param socket - Socket.IO client instance
   */
  initialize(socket: Socket): void {
    this.socket = socket;
    console.log('[WebRTC] Initialized with socket');
  }

  /**
   * Checks if the manager is initialized with a socket.
   *
   * @returns True if socket is available
   */
  isInitialized(): boolean {
    return this.socket !== null;
  }

  // ==========================================
  // Call Management
  // ==========================================

  /**
   * Starts an outgoing call to the specified user.
   *
   * @param calleeId - ID of the user to call
   * @param type - Type of call (audio/video)
   * @returns The SDP offer to send to the callee
   * @throws Error if socket is not initialized or media access fails
   */
  async startCall(
    calleeId: string,
    type: CallType,
  ): Promise<RTCSessionDescriptionInit> {
    if (!this.socket) {
      throw new Error('WebRTC not initialized. Call initialize() first.');
    }

    this.targetUserId = calleeId;
    this.createPeerConnection(calleeId);

    // Get local media stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });

      this.localStream = stream;
      useCallStore.getState().setLocalStream(stream);

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, stream);
      });
    } catch (error) {
      console.error('[WebRTC] Failed to get user media:', error);
      this.cleanup();
      throw error;
    }

    // Create and set local offer
    try {
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      console.log('[WebRTC] Created offer for:', calleeId);
      return offer;
    } catch (error) {
      console.error('[WebRTC] Failed to create offer:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Accepts an incoming call and returns the SDP answer.
   *
   * @param payload - Incoming call offer payload
   * @returns The SDP answer to send to the caller
   * @throws Error if socket is not initialized or media access fails
   */
  async acceptCall(
    payload: CallOfferPayload,
  ): Promise<RTCSessionDescriptionInit> {
    if (!this.socket) {
      throw new Error('WebRTC not initialized. Call initialize() first.');
    }

    this.targetUserId = payload.caller.id;
    this.createPeerConnection(payload.caller.id);

    // Get local media stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: payload.callType === 'video',
      });

      this.localStream = stream;
      useCallStore.getState().setLocalStream(stream);

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, stream);
      });
    } catch (error) {
      console.error('[WebRTC] Failed to get user media:', error);
      this.cleanup();
      throw error;
    }

    // Set remote description and create answer
    try {
      await this.peerConnection!.setRemoteDescription(
        new RTCSessionDescription(payload.signal),
      );

      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      console.log('[WebRTC] Created answer for:', payload.caller.id);
      return answer;
    } catch (error) {
      console.error('[WebRTC] Failed to create answer:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Handles the answer from the remote peer (caller side).
   *
   * @param payload - Call answer payload from callee
   */
  async handleAnswer(payload: CallAnswerPayload): Promise<void> {
    if (!this.peerConnection) {
      console.warn('[WebRTC] No peer connection for answer');
      return;
    }

    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(payload.signal),
      );
      console.log('[WebRTC] Remote description set from answer');
    } catch (error) {
      console.error('[WebRTC] Failed to set remote description:', error);
    }
  }

  /**
   * Handles an incoming ICE candidate from the remote peer.
   *
   * @param payload - ICE candidate payload
   */
  async handleIceCandidate(payload: IceCandidatePayload): Promise<void> {
    if (!this.peerConnection) {
      console.warn('[WebRTC] No peer connection for ICE candidate');
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(
        new RTCIceCandidate(payload.candidate),
      );
      console.log('[WebRTC] Added ICE candidate');
    } catch (error) {
      console.error('[WebRTC] Error adding ICE candidate:', error);
    }
  }

  /**
   * Ends the current call and cleans up resources.
   *
   * @param targetUserId - Optional user ID to notify (if not provided, uses current target)
   */
  endCall(targetUserId?: string): void {
    const targetId = targetUserId || this.targetUserId;

    // Notify the other party
    if (targetId && this.socket) {
      this.socket.emit(CALL_EVENTS.END, { targetUserId: targetId });
    }

    this.cleanup();
    useCallStore.getState().reset();
    console.log('[WebRTC] Call ended');
  }

  /**
   * Rejects an incoming call without answering.
   *
   * @param callerId - ID of the caller to reject
   */
  rejectCall(callerId: string): void {
    if (this.socket) {
      this.socket.emit(CALL_EVENTS.REJECT, { targetUserId: callerId });
    }
    this.cleanup();
    useCallStore.getState().reset();
    console.log('[WebRTC] Call rejected');
  }

  // ==========================================
  // Media Controls
  // ==========================================

  /**
   * Toggles the local audio track on/off.
   *
   * @returns New mute state (true = muted)
   */
  toggleAudio(): boolean {
    if (!this.localStream) return false;

    const audioTracks = this.localStream.getAudioTracks();
    const isMuted = audioTracks.some((track) => !track.enabled);

    audioTracks.forEach((track) => {
      track.enabled = isMuted;
    });

    return !isMuted;
  }

  /**
   * Toggles the local video track on/off.
   *
   * @returns New video state (true = video enabled)
   */
  toggleVideo(): boolean {
    if (!this.localStream) return true;

    const videoTracks = this.localStream.getVideoTracks();
    const isEnabled = videoTracks.some((track) => track.enabled);

    videoTracks.forEach((track) => {
      track.enabled = !isEnabled;
    });

    return !isEnabled;
  }

  // ==========================================
  // Private Methods
  // ==========================================

  /**
   * Creates a new RTCPeerConnection with event handlers.
   *
   * @param targetUserId - ID of the remote user for this connection
   */
  private createPeerConnection(targetUserId: string): void {
    // Clean up existing connection
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit(CALL_EVENTS.ICE_CANDIDATE, {
          targetUserId,
          candidate: event.candidate,
        });
        console.log('[WebRTC] Sent ICE candidate');
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log(
        '[WebRTC] Connection state:',
        this.peerConnection?.connectionState,
      );

      if (
        this.peerConnection?.connectionState === 'disconnected' ||
        this.peerConnection?.connectionState === 'failed'
      ) {
        console.warn('[WebRTC] Connection lost');
        // Optionally trigger reconnection or end call
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log(
        '[WebRTC] ICE state:',
        this.peerConnection?.iceConnectionState,
      );
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Received remote track');
      useCallStore.getState().setRemoteStream(event.streams[0] || null);
    };
  }

  /**
   * Cleans up all WebRTC resources.
   */
  private cleanup(): void {
    // Stop all local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.targetUserId = null;
  }
}

// ==========================================
// Singleton Export
// ==========================================

/**
 * Singleton WebRTC manager instance.
 * Use this throughout the application for WebRTC operations.
 */
export const webRTCManager = new WebRTCManager();
