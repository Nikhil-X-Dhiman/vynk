export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  GREETING: 'greeting',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_SEEN: 'message:seen',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'room:join',
  SEND_MESSAGE: 'message:send',
  RECEIVE_MESSAGE: 'message:receive',
  USER_TYPING: 'user:typing',
} as const;
