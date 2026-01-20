
export const MOCK_CHATS = Array.from({ length: 50 }, (_, i) => ({
  id: `chat-${i}`,
  name: `User ${i + 1}`,
  avatar: `https://i.pravatar.cc/150?u=${i}`,
  lastMessage: i % 3 === 0 ? "Hey, how are you?" : "Sent a photo",
  time: "10:30 AM",
  unreadCount: i % 5 === 0 ? 3 : 0,
  isGroup: i % 10 === 0,
  isOnline: i % 4 === 0,
}));
