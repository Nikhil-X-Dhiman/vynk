/**
 * Call Event Handlers
 *
 * Handles WebRTC signaling for audio/video calls:
 * - OFFER: Call initiation
 * - ANSWER: Call acceptance
 * - ICE_CANDIDATE: ICE candidate exchange
 * - REJECT: Call rejection
 * - END: Call termination
 */

import { Socket } from 'socket.io';
import { logger } from '../utils';
import {
  CALL_EVENTS,
  type CallOfferPayload,
  type CallAnswerPayload,
  type IceCandidatePayload,
  type CallEndPayload,
} from '@repo/shared';

export function registerCallEvents(socket: Socket): void {
  const userId = socket.data.user.id;

  // ---------------------------------------------------------------------------
  // OFFER - Initiate a call
  // ---------------------------------------------------------------------------
  socket.on(CALL_EVENTS.OFFER, (payload: CallOfferPayload) => {
    try {
      const { calleeId } = payload;

      if (!calleeId) {
        logger.warn('Call offer missing calleeId', { userId });
        return;
      }

      logger.info('Call offer', { from: userId, to: calleeId });
      socket.to(`user:${calleeId}`).emit(CALL_EVENTS.OFFER, {
        ...payload,
        callerId: userId,
      });
    } catch (error) {
      logger.error('Error in CALL_OFFER', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ---------------------------------------------------------------------------
  // ANSWER - Accept a call
  // ---------------------------------------------------------------------------
  socket.on(CALL_EVENTS.ANSWER, (payload: CallAnswerPayload) => {
    try {
      const { callerId } = payload;

      if (!callerId) {
        logger.warn('Call answer missing callerId', { userId });
        return;
      }

      logger.info('Call answer', { from: userId, to: callerId });
      socket.to(`user:${callerId}`).emit(CALL_EVENTS.ANSWER, {
        ...payload,
        calleeId: userId,
      });
    } catch (error) {
      logger.error('Error in CALL_ANSWER', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ---------------------------------------------------------------------------
  // ICE_CANDIDATE - Exchange ICE candidates
  // ---------------------------------------------------------------------------
  socket.on(CALL_EVENTS.ICE_CANDIDATE, (payload: IceCandidatePayload) => {
    try {
      const { targetUserId } = payload;

      if (!targetUserId) {
        return;
      }

      socket.to(`user:${targetUserId}`).emit(CALL_EVENTS.ICE_CANDIDATE, {
        ...payload,
        fromUserId: userId,
      });
    } catch (error) {
      logger.error('Error in CALL_ICE_CANDIDATE', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ---------------------------------------------------------------------------
  // REJECT - Reject a call
  // ---------------------------------------------------------------------------
  socket.on(CALL_EVENTS.REJECT, (payload: CallEndPayload) => {
    try {
      const { targetUserId } = payload;

      if (!targetUserId) {
        return;
      }

      logger.info('Call rejected', { by: userId, target: targetUserId });
      socket.to(`user:${targetUserId}`).emit(CALL_EVENTS.REJECT, {
        ...payload,
        rejectedBy: userId,
      });
    } catch (error) {
      logger.error('Error in CALL_REJECT', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ---------------------------------------------------------------------------
  // END - End a call
  // ---------------------------------------------------------------------------
  socket.on(CALL_EVENTS.END, (payload: CallEndPayload) => {
    try {
      const { targetUserId } = payload;

      if (!targetUserId) {
        return;
      }

      logger.info('Call ended', { by: userId, target: targetUserId });
      socket.to(`user:${targetUserId}`).emit(CALL_EVENTS.END, {
        ...payload,
        endedBy: userId,
      });
    } catch (error) {
      logger.error('Error in CALL_END', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
