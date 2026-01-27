import { CALL_EVENTS, CallOfferPayload, CallAnswerPayload, IceCandidatePayload } from '@repo/shared';
import { Socket } from 'socket.io-client';
import { useCallStore } from '@/store/use-call-store';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;

  initialize(socket: Socket) {
    this.socket = socket;
  }

  async startCall(calleeId: string, type: 'audio' | 'video') {
    if (!this.socket) return;

    this.createPeerConnection(calleeId);

    // Get Local Stream
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });

    this.localStream = stream;
    useCallStore.getState().setLocalStream(stream);

    // Add tracks to PC
    stream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, stream);
    });

    // Create Offer
    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);

    return offer;
  }

  async acceptCall(payload: CallOfferPayload) {
    if (!this.socket) return;

    this.createPeerConnection(payload.caller.id);

    // Get Local Stream
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: payload.callType === 'video',
    });

    this.localStream = stream;
    useCallStore.getState().setLocalStream(stream);

    // Add tracks
    stream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, stream);
    });

    // Set Remote Description
    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(payload.signal));

    // Create Answer
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);

    return answer;
  }

  async handleAnswer(payload: CallAnswerPayload) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.signal));
  }

  async handleIceCandidate(payload: IceCandidatePayload) {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
    } catch (e) {
      console.error('Error adding received ice candidate', e);
    }
  }

  endCall(targetUserId?: string) {
    if (targetUserId && this.socket) {
        this.socket.emit(CALL_EVENTS.END, { targetUserId });
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    useCallStore.getState().reset();
  }

  private createPeerConnection(targetUserId: string) {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit(CALL_EVENTS.ICE_CANDIDATE, {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      useCallStore.getState().setRemoteStream(event.streams[0]);
    };
  }
}

export const webRTCManager = new WebRTCManager();
