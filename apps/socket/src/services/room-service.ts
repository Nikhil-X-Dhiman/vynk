import { Socket } from 'socket.io';
import { getUserJoinedGroups } from '@repo/db';

class RoomService {
  /**
   * Generates a consistent private room ID for two users.
   * Sorts user IDs to ensure order independence.
   */
  static getPrivateRoomId(user1: string, user2: string): string {
    const sortedIds = [user1, user2].sort();
    return `private_${sortedIds[0]}_${sortedIds[1]}`;
  }

  /**
   * Joins a user to their personal room and all their group rooms.
   */
  static async joinUserRooms(socket: Socket, userId: string) {
    // 1. Join personal room (for specific notifications/invites)
    socket.join(`user:${userId}`);

    // 2. Fetch and join all group conversations
    const groupsResult = await getUserJoinedGroups(userId);
    if (groupsResult.success && groupsResult.data) {
      groupsResult.data.forEach((group) => {
        socket.join(`group:${group.id}`);
      });
    }
  }

  /**
   * Joins a user to a specific conversation room.
   * Distinguishes between group and private naming conventions if needed,

   * Requirement 5 says: use "private_user1_user2" for private messages.
   * Requirement 7 says: use "groupid" for groups.
   */
  static joinConversation(socket: Socket, roomId: string) {
    socket.join(roomId);
  }
}

export { RoomService };
