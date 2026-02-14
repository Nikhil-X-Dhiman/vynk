// Database clients
export { db } from '../kysely/db';
export { sql } from 'kysely'
export { Pool } from '../pg/postgres';

// Redis exports
export * from '../redis/src';

// Auth module
export { createNewUser, findUserByPhone, findUserById } from './auth';
export type {
  CreateUserParams,
  CreateUserResult,
  User,
  FindUserByPhoneParams,
  FindUserByPhoneResult,
} from './auth';

// Conversation module
export {
  getConversation,
  getUserConversations,
  getUserJoinedGroups,
  createConversation,
  findPrivateConversation,
  updateConversation,
  deleteConversation,
} from './conversation'
export type {
  Conversation,
  GetConversationResult,
  ConversationListItem,
  GetUserConversationsResult,
  CreateConversationParams,
  CreateConversationResult,
  FindPrivateConversationResult,
  UpdateConversationParams,
  UpdateConversationResult,
  DeleteConversationResult,
} from './conversation'

// Message module
export { sendMessage } from './message';
export type { SendMessageParams, SendMessageResult } from './message';

export { getUserMessages } from './message'
export type { Message, GetMessagesResult } from './message'

export { deleteMessage, hardDeleteMessage } from './message';
export type {
  DeleteMessageResult,
  UpdateMessageParams,
  UpdateMessageResult,
} from './message'
export { updateMessage } from './message'

export { toggleMessageReaction, getMessageReactions } from './message';
export type {
  ToggleReactionParams,
  ToggleReactionResult,
  Reaction,
  GetMessageReactionsResult,
} from './message';

// Participant module
export {
  getParticipants,
  getParticipant,
  getUserParticipants,
} from './participant'
export type {
  Participant,
  GetParticipantsResult,
  GetParticipantResult,
} from './participant';

export { addParticipant } from './participant';
export type { AddParticipantParams, AddParticipantResult } from './participant';

export { updateParticipantRole, resetUnreadCount } from './participant';
export type {
  UpdateParticipantRoleResult,
  ResetUnreadCountResult,
} from './participant';

export { removeParticipant } from './participant';
export type { RemoveParticipantResult } from './participant';

export { markAsRead } from './participant';
export type { MarkAsReadParams, MarkAsReadResult } from './participant';

// User module
export { findUsersByIds } from './user';
export type { UserBasic, FindUsersByIdsResult } from './user';

export { getAllUsers, getUsersDelta } from './user';
export type {
  UserListItem,
  GetAllUsersResult,
  GetUsersDeltaParams,
  GetUsersDeltaResult,
} from './user';

export { updateUserProfile, deleteUser } from './user';
export type {
  UpdateUserProfileParams,
  UpdateUserProfileResult,
  DeleteUserResult,
} from './user';

// Sync module
export * from './sync'
