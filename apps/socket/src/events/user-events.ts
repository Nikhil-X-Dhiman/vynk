import { Socket } from 'socket.io';
import { db } from '@repo/db'; // Adjust import based on workspace
import { SOCKET_EVENTS } from '@repo/shared';

export function registerUserEvents(socket: Socket) {
  // Send initial list immediately upon connection (or we could wait for a request event)
  // For now, let's send it immediately to populate the cache.
  sendAllUsers(socket);
}

async function sendAllUsers(socket: Socket) {
  try {
    const users = await db
      .selectFrom('user')
      .select(['id', 'user_name as name', 'avatar_url as avatar', 'updated_at as updatedAt', 'phone_number as phoneNumber', 'bio'])
      .execute();

    // Map to LocalUser format if needed (postgres returns Date for timestamps, plain objects)
    // Dexie expects number for timestamp usually, or Date. Our interface said number.
    const formattedUsers = users.map(u => ({
      ...u,
      updatedAt: u.updatedAt instanceof Date ? u.updatedAt.getTime() : new Date(u.updatedAt).getTime(),
    }));

    socket.emit(SOCKET_EVENTS.USER_LIST_INITIAL, formattedUsers);
  } catch (error) {
    console.error('Failed to send user list:', error);
  }
}
