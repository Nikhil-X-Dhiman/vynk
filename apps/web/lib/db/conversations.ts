import type { VynkLocalDB } from './core'

/**
 * Get display name for a conversation (handles 1:1 chats)
 */
export async function getConversationDisplayInfo(
  db: VynkLocalDB,
  conversationId: string,
  currentUserId: string,
): Promise<{ name: string; avatar: string | null }> {
  const conv = await db.conversations
    .where('conversationId')
    .equals(conversationId)
    .first()

  if (!conv) {
    return { name: 'Unknown', avatar: null }
  }

  if (conv.type === 'group') {
    return { name: conv.title || 'Group', avatar: conv.groupImg || null }
  }

  // For private chats, get the other participant's info
  const participants = await db.participants
    .where('conversationId')
    .equals(conversationId)
    .toArray()

  const otherParticipant = participants.find((p) => p.userId !== currentUserId)

  if (otherParticipant) {
    const user = await db.users.get(otherParticipant.userId)
    if (user) {
      return { name: user.name, avatar: user.avatar }
    }
  }

  // Self-chat: only participant is the current user
  if (participants.length === 1 && participants[0].userId === currentUserId) {
    const self = await db.users.get(currentUserId)
    return { name: 'You', avatar: self?.avatar ?? null }
  }

  return { name: conv.title || 'Unknown', avatar: null }
}

/**
 * Creates or finds a conversation with a target user.
 * Supports self-chat (targetUserId === currentUserId).
 * Uses UUIDv7 for new conversations so the same ID works locally and on the server.
 *
 * @returns conversationId and whether it was newly created, or null if target user not found.
 */
export async function createLocalConversation(
  db: VynkLocalDB,
  targetUserId: string,
  currentUserId: string,
): Promise<{ conversationId: string; isNew: boolean } | null> {
  const targetUser = await db.users.get(targetUserId)
  if (!targetUser) return null

  const isSelfChat = targetUserId === currentUserId

  if (isSelfChat) {
    // Check for an existing self-conversation (single participant = self)
    const myParticipants = await db.participants
      .where('userId')
      .equals(currentUserId)
      .toArray()

    for (const p of myParticipants) {
      const allInConv = await db.participants
        .where('conversationId')
        .equals(p.conversationId)
        .toArray()

      if (allInConv.length === 1 && allInConv[0].userId === currentUserId) {
        return { conversationId: p.conversationId, isNew: false }
      }
    }

    // No existing self-conversation — create one
    const { v7: uuidv7 } = await import('uuid')
    const conversationId = uuidv7()

    await db.conversations.add({
      conversationId,
      title: 'You',
      type: 'private',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      unreadCount: 0,
      isVirtual: true,
      displayName: 'You',
      displayAvatar: targetUser.avatar,
    })

    await db.participants.add({
      id: `${conversationId}_${currentUserId}`,
      conversationId,
      userId: currentUserId,
      role: 'member',
      unreadCount: 0,
    })

    return { conversationId, isNew: true }
  }

  // --- Normal two-user conversation ---

  // Check if a private conversation already exists between these two users
  const targetParticipants = await db.participants
    .where('userId')
    .equals(targetUserId)
    .toArray()

  for (const tp of targetParticipants) {
    const currentUserParticipant = await db.participants
      .where('conversationId')
      .equals(tp.conversationId)
      .filter((p) => p.userId === currentUserId)
      .first()

    if (currentUserParticipant) {
      // Conversation already exists — return it
      return { conversationId: tp.conversationId, isNew: false }
    }
  }

  // No existing conversation — create with UUIDv7
  const { v7: uuidv7 } = await import('uuid')
  const conversationId = uuidv7()

  await db.conversations.add({
    conversationId,
    title: targetUser.name,
    type: 'private',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    unreadCount: 0,
    isVirtual: true,
    displayName: targetUser.name,
    displayAvatar: targetUser.avatar,
  })

  // Add participants locally
  await db.participants.bulkAdd([
    {
      id: `${conversationId}_${currentUserId}`,
      conversationId,
      userId: currentUserId,
      role: 'member',
      unreadCount: 0,
    },
    {
      id: `${conversationId}_${targetUserId}`,
      conversationId,
      userId: targetUserId,
      role: 'member',
      unreadCount: 0,
    },
  ])

  return { conversationId, isNew: true }
}

/**
 * Marks a local conversation as persisted on the server.
 * Since we use UUIDv7 from the start, the ID never changes.
 */
export async function persistConversation(
  db: VynkLocalDB,
  conversationId: string,
): Promise<void> {
  const conv = await db.conversations
    .where('conversationId')
    .equals(conversationId)
    .first()

  if (!conv) return

  await db.conversations.update(conv.id!, { isVirtual: false })
}
