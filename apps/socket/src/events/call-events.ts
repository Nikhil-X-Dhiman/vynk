import { Server, Socket } from 'socket.io';
import { CALL_EVENTS, CallOfferPayload, CallAnswerPayload, IceCandidatePayload, CallEndPayload } from '@repo/shared';

export const registerCallEvents = (socket: Socket) => {
  // Handle Call Offer
  socket.on(CALL_EVENTS.OFFER, (payload: CallOfferPayload) => {
    const { calleeId } = payload;
    console.log(`Call offer from ${socket.data.user.id} to ${calleeId}`);
    socket.to(calleeId).emit(CALL_EVENTS.OFFER, payload);
  });

  // Handle Call Answer
  socket.on(CALL_EVENTS.ANSWER, (payload: CallAnswerPayload) => {
    const { callerId } = payload;
    console.log(`Call answer from ${socket.data.user.id} to ${callerId}`);
    socket.to(callerId).emit(CALL_EVENTS.ANSWER, payload);
  });

  // Handle ICE Candidate
  socket.on(CALL_EVENTS.ICE_CANDIDATE, (payload: IceCandidatePayload) => {
    const { targetUserId, candidate } = payload;
    // console.log(`ICE candidate from ${socket.data.user.id} to ${targetUserId}`);
    socket.to(targetUserId).emit(CALL_EVENTS.ICE_CANDIDATE, payload);
  });

  // Handle Call Rejection
  socket.on(CALL_EVENTS.REJECT, (payload: CallEndPayload) => {
    const { targetUserId } = payload;
    console.log(`Call rejected by ${socket.data.user.id} for ${targetUserId}`);
    socket.to(targetUserId).emit(CALL_EVENTS.REJECT, payload);
  });

  // Handle Call End
  socket.on(CALL_EVENTS.END, (payload: CallEndPayload) => {
     const { targetUserId } = payload;
     console.log(`Call ended by ${socket.data.user.id} for ${targetUserId}`);
     socket.to(targetUserId).emit(CALL_EVENTS.END, payload);
  });
};
