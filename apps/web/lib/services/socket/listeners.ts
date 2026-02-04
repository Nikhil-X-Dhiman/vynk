import { getSocket } from './client';
import { SOCKET_EVENTS } from '@repo/shared';
import { db, LocalUser } from '@/lib/db';
import { SyncService } from '@/lib/services/sync';

/**
 * Handle incoming new message events
 */
export function onMessageReceived(
  callback: (msg: { id: string; text: string }) => void,
) {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.MESSAGE_NEW, callback);
}

/**
 * Register listeners for user synchronization
 * Called once on app initialization
 */
export function registerUserSyncListeners() {
  const socket = getSocket();

  // Handle initial user list (on connection/reconnection)
  socket.on(SOCKET_EVENTS.USER_LIST_INITIAL, async (users: LocalUser[]) => {
    try {
      await db.users.bulkPut(users);
      console.log(`[Sync] User list synced: ${users.length} users`);
    } catch (error) {
      console.error('[Sync] Failed to sync user list', error);
    }
  });

  // Handle new user registration
  socket.on(SOCKET_EVENTS.USER_NEW, async (user: LocalUser) => {
    try {
      await db.users.put(user);
      console.log(`[Sync] New user added: ${user.name}`);
    } catch (error) {
      console.error('[Sync] Failed to add new user', error);
    }
  });

  // Handle connection events
  socket.on('connect', () => {
    console.log('[Socket] Connected');
    // Trigger delta sync on reconnection
    SyncService.performDeltaSync().catch(console.error);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('reconnect', () => {
    console.log('[Socket] Reconnected');
    // Trigger delta sync on reconnection
    SyncService.performDeltaSync().catch(console.error);
  });

  // Handle sync trigger event (server can tell clients to sync)
  socket.on('sync:trigger', async () => {
    console.log('[Socket] Sync triggered by server');
    await SyncService.performDeltaSync();
  });
}

/**
 * Register conversation-specific listeners
 */
export function registerConversationListeners() {
  const socket = getSocket();

  // Handle conversation updates (new message, member changes, etc.)
  socket.on(
    'conversation:updated',
    async (data: { conversationId: string }) => {
      try {
        // Trigger a delta sync to get the latest changes
        await SyncService.performDeltaSync();
        console.log(`[Sync] Conversation ${data.conversationId} updated`);
      } catch (error) {
        console.error('[Sync] Failed to sync conversation update', error);
      }
    },
  );

  // Handle new conversation creation
  socket.on('conversation:new', async (conversation: any) => {
    try {
      await db.conversations.add({
        conversationId: conversation.id,
        title: conversation.title || '',
        type: conversation.type,
        groupImg: conversation.groupImg || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        unreadCount: 0,
        isVirtual: false,
        displayName: conversation.displayName,
        displayAvatar: conversation.displayAvatar,
      });
      console.log('[Sync] New conversation added');
    } catch (error) {
      console.error('[Sync] Failed to add new conversation', error);
    }
  });
}

/**
 * Unregister all listeners (for cleanup)
 */
export function unregisterAllListeners() {
  const socket = getSocket();

  socket.off(SOCKET_EVENTS.USER_LIST_INITIAL);
  socket.off(SOCKET_EVENTS.USER_NEW);
  socket.off(SOCKET_EVENTS.MESSAGE_NEW);
  socket.off('connect');
  socket.off('disconnect');
  socket.off('reconnect');
  socket.off('sync:trigger');
  socket.off('conversation:updated');
  socket.off('conversation:new');
}
