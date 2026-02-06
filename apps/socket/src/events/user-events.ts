/**
 * User Sync Event Handlers
 *
 * Handles user list synchronization:
 * - Sends initial user list on connection
 * - Supports delta sync for incremental updates
 */

import { Socket } from 'socket.io';
import { db, getAllUsers, getUsersDelta } from '@repo/db';
import { logger } from '../utils';
import { SOCKET_EVENTS } from '@repo/shared';
import type {
  LocalUserPayload,
  UserDeltaRequestPayload,
  UserDeltaResponsePayload,
  SocketCallback,
} from '@repo/shared';

/**
 * Formats user data for client consumption
 */
function formatUser(user: {
  id: string;
  user_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  bio: string | null;
  updated_at: Date;
}): LocalUserPayload {
  return {
    id: user.id,
    name: user.user_name || '',
    avatar: user.avatar_url,
    phoneNumber: user.phone_number || undefined,
    bio: user.bio || undefined,
    updatedAt:
      user.updated_at instanceof Date
        ? user.updated_at.getTime()
        : new Date(user.updated_at).getTime(),
  };
}

export function registerUserEvents(socket: Socket): void {
  const userId = socket.data.user.id;

  // Send initial user list on connection
  sendInitialUserList(socket);

  // ---------------------------------------------------------------------------
  // USER_DELTA_REQUEST - Get users updated since timestamp
  // ---------------------------------------------------------------------------
  socket.on(
    SOCKET_EVENTS.USER_DELTA_REQUEST,
    async (
      payload: UserDeltaRequestPayload,
      callback?: (res: UserDeltaResponsePayload | { error: string }) => void,
    ) => {
      try {
        const { since } = payload;

        if (!since || typeof since !== 'number') {
          callback?.({ error: 'since timestamp is required' });
          return;
        }

        const result = await getUsersDelta({ since: new Date(since) });

        if (!result.success) {
          callback?.({ error: result.error || 'Failed to fetch user updates' });
          return;
        }

        const formattedUsers = result.data.map((user) => ({
          id: user.id,
          name: user.name || '',
          avatar: user.avatar,
          phoneNumber: user.phoneNumber || undefined,
          bio: user.bio || undefined,
          updatedAt:
            user.updatedAt instanceof Date
              ? user.updatedAt.getTime()
              : new Date(user.updatedAt).getTime(),
        }));

        callback?.({
          users: formattedUsers,
          syncedAt: Date.now(),
        });

        logger.debug('Delta user sync', {
          userId,
          since,
          count: formattedUsers.length,
        });
      } catch (error) {
        logger.error('Error in USER_DELTA_REQUEST', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        callback?.({ error: 'Internal server error' });
      }
    },
  );
}

/**
 * Sends the initial user list to a newly connected socket
 */
async function sendInitialUserList(socket: Socket): Promise<void> {
  try {
    const users = await db
      .selectFrom('user')
      .select([
        'id',
        'user_name',
        'avatar_url',
        'updated_at',
        'phone_number',
        'bio',
      ])
      .execute();

    const formattedUsers = users.map(formatUser);
    socket.emit(SOCKET_EVENTS.USER_LIST_INITIAL, formattedUsers);

    logger.debug('Sent initial user list', {
      socketId: socket.id,
      count: formattedUsers.length,
    });
  } catch (error) {
    logger.error('Failed to send initial user list', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
