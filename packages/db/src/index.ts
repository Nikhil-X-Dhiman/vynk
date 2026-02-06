// Database clients
export { db } from '../kysely/db';
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
} from './conversation';
export type {
  Conversation,
  GetConversationResult,
  ConversationListItem,
  GetUserConversationsResult,
  CreateConversationParams,
  CreateConversationResult,
  FindPrivateConversationResult,
} from './conversation';

// Delivery module
export { createDelivery } from './delivery';
export type { CreateDeliveryParams, CreateDeliveryResult } from './delivery';

export { getMessageDeliveryStatus } from './delivery';
export type {
  DeliveryStatus,
  GetMessageDeliveryStatusResult,
} from './delivery';

export { updateDeliveryStatus } from './delivery';
export type {
  UpdateDeliveryStatusParams,
  UpdateDeliveryStatusResult,
} from './delivery';

// Message module
export { sendMessage } from './message';
export type { SendMessageParams, SendMessageResult } from './message';

export { getMessages, getMessageById } from './message';
export type {
  Message,
  GetMessagesParams,
  GetMessagesResult,
  GetMessageByIdResult,
} from './message';

export { deleteMessage, hardDeleteMessage } from './message';
export type { DeleteMessageResult } from './message';

export { toggleMessageReaction, getMessageReactions } from './message';
export type {
  ToggleReactionParams,
  ToggleReactionResult,
  Reaction,
  GetMessageReactionsResult,
} from './message';

// Participant module
export { getParticipants, getParticipant } from './participant';
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

// Story module
export { createStory } from './story';
export type { CreateStoryParams, CreateStoryResult } from './story';

export { getFriendsStories, getStoryViewers, getStoryViewCount } from './story';
export type {
  Story,
  GetFriendsStoriesResult,
  StoryViewer,
  GetStoryViewersResult,
  GetStoryViewCountResult,
} from './story';

export { deleteStory } from './story';
export type { DeleteStoryResult } from './story';

export { recordStoryView } from './story';
export type { RecordStoryViewParams, RecordStoryViewResult } from './story';

export { toggleStoryReaction, getStoryReactions } from './story';
export type {
  ToggleStoryReactionParams,
  ToggleStoryReactionResult,
  StoryReaction,
  GetStoryReactionsResult,
} from './story';

// Settings module
export { getSettings } from './settings';
export type { Settings, GetSettingsResult } from './settings';

export { updateSettings, deleteSettings } from './settings';
export type { UpdateSettingsParams, UpdateSettingsResult } from './settings';

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

// Friendship module
export { sendFriendRequest } from './friendship';
export type {
  SendFriendRequestParams,
  SendFriendRequestResult,
} from './friendship';

export { getFriends, getPendingFriendRequests } from './friendship';
export type {
  Friend,
  GetFriendsResult,
  FriendRequest,
  GetPendingRequestsResult,
} from './friendship';

export { respondToFriendRequest, blockUser } from './friendship';
export type {
  RespondToFriendRequestParams,
  RespondToFriendRequestResult,
  BlockUserResult,
} from './friendship';

export { removeFriend } from './friendship';
export type { RemoveFriendResult } from './friendship';
