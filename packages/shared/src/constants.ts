/**
 * Socket Events - Shared between client and server
 *
 * Naming convention: `entity:action`
 * - Incoming (client → server): action verb (e.g., 'send', 'delete')
 * - Outgoing (server → client): past tense/state (e.g., 'new', 'deleted')
 */
export const SOCKET_EVENTS = {
  // ===========================================================================
  // Connection
  // ===========================================================================
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  // ===========================================================================
  // Room Management
  // ===========================================================================
  JOIN_ROOM: 'room:join',

  // ===========================================================================
  // Messages
  // ===========================================================================
  /** Client sends a message */
  MESSAGE_SEND: 'message:send',
  /** Server broadcasts new message to room */
  MESSAGE_NEW: 'message:new',
  /** Server confirms message was delivered to recipient */
  MESSAGE_DELIVERED: 'message:delivered',
  /** Client marks message as read */
  MESSAGE_READ: 'message:read',
  /** Server confirms message was seen */
  MESSAGE_SEEN: 'user:seen',
  /** Client deletes a message */
  MESSAGE_DELETE: 'message:delete',
  /** Server broadcasts message deletion */
  MESSAGE_DELETED: 'message:deleted',
  /** Client adds/removes reaction */
  MESSAGE_REACTION: 'message:reaction',
  /** Server broadcasts reaction update */
  MESSAGE_REACTION_UPDATE: 'message:reaction-update',

  // ===========================================================================
  // Typing Indicators
  // ===========================================================================
  /** Client starts typing */
  TYPING_START: 'typing:start',
  /** Client stops typing */
  TYPING_STOP: 'typing:stop',
  /** Server broadcasts user is typing */
  USER_TYPING: 'user:typing',

  // ===========================================================================
  // Presence / Status
  // ===========================================================================
  /** Server notifies user came online */
  USER_ONLINE: 'user:online',
  /** Server notifies user went offline */
  USER_OFFLINE: 'user:offline',
  /** Client requests user status */
  GET_USER_STATUS: 'user:get-status',

  // ===========================================================================
  // Conversations
  // ===========================================================================
  /** Client joins a conversation */
  CONVERSATION_JOIN: 'conversation:join',
  /** Client creates a conversation */
  CONVERSATION_CREATE: 'conversation:create',
  /** Server broadcasts new conversation */
  CONVERSATION_CREATED: 'conversation:created',
  /** Client leaves a conversation */
  CONVERSATION_LEAVE: 'conversation:leave',
  /** Server broadcasts user left */
  CONVERSATION_LEFT: 'conversation:left',
  /** Server broadcasts conversation update */
  CONVERSATION_UPDATED: 'conversation:updated',
  /** Client marks entire conversation as read */
  CONVERSATION_READ: 'conversation:read',
  /** Server confirms conversation was seen */
  CONVERSATION_SEEN: 'conversation:seen',

  // ===========================================================================
  // User Sync
  // ===========================================================================
  /** Server sends initial user list on connect */
  USER_LIST_INITIAL: 'user:list-initial',
  /** Server broadcasts new user registration */
  USER_NEW: 'user:new',
  /** Client requests delta user updates */
  USER_DELTA_REQUEST: 'user:delta-request',
  /** Server sends delta user updates */
  USER_DELTA_RESPONSE: 'user:delta-response',
} as const

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
