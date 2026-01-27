"use client";

import { useEffect } from 'react';
import { getSocket } from '@/lib/services/socket/client';
import { useCallStore } from '@/store/use-call-store';
import { webRTCManager } from '@/lib/webrtc';
import { CALL_EVENTS, CallOfferPayload, CallAnswerPayload, IceCandidatePayload, CallEndPayload } from '@repo/shared';
import { CallModal } from './call-modal';
import { ActiveCall } from './active-call';

import { useAuthStore } from '@/store/auth';

import { usePresenceStore } from '@/store/use-presence-store';
import { SOCKET_EVENTS } from '@repo/shared';

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { incomingCall, callState, startCall: _startCall, caller, callee, callType, endCall: storeEndCall } = useCallStore();
  const { user } = useAuthStore();
  const { setOnline, setOffline } = usePresenceStore(); // Use new store

  // We need to trigger the OFFER when callState becomes 'outgoing'.
  // However, startCall action sets state to 'outgoing'.
  // We should listen to state change or handle it in the action.
  // Ideally, valid Side Effects belong in a useEffect or middleware.
  // Here we use useEffect on callState.

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    webRTCManager.initialize(socket);

    const handleOffer = (payload: CallOfferPayload) => {
      console.log('Incoming Call Offer:', payload);
      incomingCall(payload.caller, payload.callType);
      useCallStore.setState({ signal: payload.signal });
    };

    const handleAnswer = (payload: CallAnswerPayload) => {
      console.log('Call Answered:', payload);
      useCallStore.getState().acceptCall(); // Update state to connected
      webRTCManager.handleAnswer(payload);
    };

    const handleIceCandidate = (payload: IceCandidatePayload) => {
      webRTCManager.handleIceCandidate(payload);
    };

    const handleReject = (payload: CallEndPayload) => {
       console.log('Call Rejected');
       webRTCManager.endCall(); // Clean up locally
    };

    const handleEnd = (payload: CallEndPayload) => {
       console.log('Call Ended');
       webRTCManager.endCall();
    }

    const handleUserOnline = (payload: { userId: string }) => {
        setOnline(payload.userId);
    };

    const handleUserOffline = (payload: { userId: string }) => {
        setOffline(payload.userId);
    };

    socket.on(CALL_EVENTS.OFFER, handleOffer);
    socket.on(CALL_EVENTS.ANSWER, handleAnswer);
    socket.on(CALL_EVENTS.ICE_CANDIDATE, handleIceCandidate);
    socket.on(CALL_EVENTS.REJECT, handleReject);
    socket.on(CALL_EVENTS.END, handleEnd);

    // Use string literals matching server implementation for now if import is tricky
    // socket.on('user:online', handleUserOnline); // SOCKET_EVENTS.USER_ONLINE
    // socket.on('user:offline', handleUserOffline); // SOCKET_EVENTS.USER_OFFLINE
    socket.on(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);

    return () => {
      socket.off(CALL_EVENTS.OFFER, handleOffer);
      socket.off(CALL_EVENTS.ANSWER, handleAnswer);
      socket.off(CALL_EVENTS.ICE_CANDIDATE, handleIceCandidate);
      socket.off(CALL_EVENTS.REJECT, handleReject);
      socket.off(CALL_EVENTS.END, handleEnd);
      socket.off(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
    };
  }, []);

  // Handle Outgoing Call initiation
  useEffect(() => {
    if (callState === 'outgoing' && callee) {
      // Initiate WebRTC Offer
      webRTCManager.startCall(callee.id, callType).then((offer) => {
          if (offer) {
              const socket = getSocket();

              if (!user) {
                  console.error('User not authenticated, cannot start call');
                  return;
              }

              const payload: CallOfferPayload = {
                  caller: {
                      id: user.id,
                      name: user.name,
                      avatar: user.image || undefined
                  },
                  calleeId: callee.id,
                  signal: offer,
                  callType: callType
              };
              socket?.emit(CALL_EVENTS.OFFER, payload);
          }
      });
    }
  }, [callState, callee, callType, user]);

  // We need to handle Accept Call action.
  // The store `acceptCall` just updates state.
  // We need to trigger WebRTC answer.
  const { signal, caller: incomingCaller } = useCallStore() as any;

  // This effect runs when state becomes connected AND we were in incoming state previously?
  // Easier: Subscribe to state changes or just intercept the action?
  // Zustand subscribe:
  useEffect(() => {
      return useCallStore.subscribe((state, prevState) => {
          if (state.callState === 'connected' && prevState.callState === 'incoming') {
              // User Accepted
              const userData = useAuthStore.getState().user;
              if (!userData) {
                  console.error("No user data found in auth store");
                  return;
              }

              const socket = getSocket();
              if (state.signal && state.caller) {
                   const payload = {
                       caller: state.caller,
                       calleeId: userData.id,
                       signal: state.signal,
                       callType: state.callType
                   };
                   webRTCManager.acceptCall(payload).then((answer) => {
                       if (answer) {
                           const answerPayload: CallAnswerPayload = {
                               callerId: state.caller!.id,
                               callee: {
                                   id: userData.id,
                                   name: userData.name,
                                   avatar: userData.image || undefined
                               },
                               signal: answer
                           };
                           socket?.emit(CALL_EVENTS.ANSWER, answerPayload);
                       }
                   });
              }
          }

          if (state.callState === 'ended' && prevState.callState === 'incoming') {
               // User Rejected
               const socket = getSocket();
               if (prevState.caller) {
                   socket?.emit(CALL_EVENTS.REJECT, { targetUserId: prevState.caller.id });
               }
          }
      });
  }, []);

  return (
    <>
      {children}
      <CallModal />
      <ActiveCall />
    </>
  );
}
