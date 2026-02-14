export interface LocalMessage {
  id?: number
  messageId?: string // Server ID
  conversationId: string
  senderId?: string
  content: string
  mediaType?: string | null
  mediaUrl?: string | null
  replyTo?: string | null
  status: 'pending' | 'sent' | 'delivered' | 'seen'
  timestamp: number
}

export interface LocalStory {
  id?: number
  storyId?: string
  contentUrl: string
  expiresAt: number
}

export interface LocalConversation {
  id?: number
  conversationId: string // Server ID
  title?: string
  type: 'private' | 'group' | 'broadcast'
  groupImg?: string
  groupBio?: string
  createdAt: number
  updatedAt: number
  lastMessageId?: string
  lastMessage?: string
  lastMessageAt?: number | null
  unreadCount: number
  // Virtual flag - conversation not yet saved to server
  isVirtual?: boolean
  // For display purposes (1:1 chats)
  displayName?: string
  displayAvatar?: string | null
}

export interface LocalUser {
  id: string // User ID (primary key)
  name: string
  avatar: string | null
  phoneNumber?: string
  bio?: string
  updatedAt: number
}

export interface LocalParticipant {
  id: string // Compound key: conversationId_userId
  conversationId: string
  userId: string
  role: 'member' | 'admin'
  unreadCount: number
}

export interface Meta {
  key: string
  value: any
}
