/**
 * Socket Events - Shared between client and server
 */
export const SOCKET_EVENTS = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  // Room
  JOIN_ROOM: 'room:join',

  // Messages
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  MESSAGE_SEEN: 'message:seen',
  MESSAGE_REACTION: 'message:reaction',

  // Typing
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  USER_TYPING: 'user:typing',

  // Presence
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_SEEN: 'user:seen',
  GET_USER_STATUS: 'user:get-status',

  // Conversations
  CONVERSATION_JOIN: 'conversation:join',

  // Stories
  STORY_PUBLISH: 'story:publish',
  STORY_NEW: 'story:new',
  STORY_READ: 'story:read',
  STORY_REACTION: 'story:reaction',

  // User Sync
  USER_LIST_INITIAL: 'user:list-initial',
  USER_NEW: 'user:new',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
