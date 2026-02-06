/**
 * Room Service
 *
 * Manages socket room operations:
 * - Private room ID generation
 * - User room auto-joining
 * - Room membership management
 */

import { Socket } from 'socket.io';
import { getUserJoinedGroups } from '@repo/db';
import { logger } from '../utils';

export class RoomService {
  /**
   * Generates a consistent private room ID for two users.
   * Sorts user IDs to ensure order independence.
   *
   * @example
   * getPrivateRoomId('user-a', 'user-b') === getPrivateRoomId('user-b', 'user-a')
   */
  static getPrivateRoomId(user1: string, user2: string): string {
    const sortedIds = [user1, user2].sort();
    return `private_${sortedIds[0]}_${sortedIds[1]}`;
  }

  /**
   * Joins a user to their personal room and all their group rooms.
   * Called on connection to enable receiving messages.
   */
  static async joinUserRooms(socket: Socket, userId: string): Promise<void> {
    try {
      // 1. Join personal room (for direct notifications)
      socket.join(`user:${userId}`);
      logger.debug('Joined personal room', { userId, room: `user:${userId}` });

      // 2. Fetch and join all group conversations
      const groupsResult = await getUserJoinedGroups(userId);

      if (groupsResult.success && groupsResult.data) {
        const groupRooms: string[] = [];

        groupsResult.data.forEach((group) => {
          const roomId = `group:${group.id}`;
          socket.join(roomId);
          groupRooms.push(roomId);
        });

        if (groupRooms.length > 0) {
          logger.debug('Joined group rooms', {
            userId,
            count: groupRooms.length,
          });
        }
      }
    } catch (error) {
      logger.error('Error joining user rooms', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - connection should still work for direct messages
    }
  }

  /**
   * Joins a user to a specific conversation room.
   */
  static joinConversation(socket: Socket, roomId: string): void {
    socket.join(roomId);
    logger.debug('Joined conversation room', {
      socketId: socket.id,
      room: roomId,
    });
  }

  /**
   * Removes a user from a specific conversation room.
   */
  static leaveConversation(socket: Socket, roomId: string): void {
    socket.leave(roomId);
    logger.debug('Left conversation room', {
      socketId: socket.id,
      room: roomId,
    });
  }

  /**
   * Checks if a socket is in a specific room.
   */
  static isInRoom(socket: Socket, roomId: string): boolean {
    return socket.rooms.has(roomId);
  }

  /**
   * Gets all rooms a socket is currently in.
   * Excludes the socket's own ID room.
   */
  static getRooms(socket: Socket): string[] {
    return Array.from(socket.rooms).filter((room) => room !== socket.id);
  }
}
