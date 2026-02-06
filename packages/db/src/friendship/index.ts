export { sendFriendRequest } from './create';
export type {
  SendFriendRequestParams,
  SendFriendRequestResult,
} from './create';

export { getFriends, getPendingFriendRequests } from './get';
export type {
  Friend,
  GetFriendsResult,
  FriendRequest,
  GetPendingRequestsResult,
} from './get';

export { respondToFriendRequest, blockUser } from './update';
export type {
  RespondToFriendRequestParams,
  RespondToFriendRequestResult,
  BlockUserResult,
} from './update';

export { removeFriend } from './delete';
export type { RemoveFriendResult } from './delete';
