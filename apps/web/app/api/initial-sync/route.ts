import { NextResponse } from 'next/server';
import {
  getAllUsers,
  getUserConversations,
  getParticipants,
  findUsersByIds,
} from '@repo/db';
import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';

/**
 * GET: Performs initial sync on login
 * Returns all users, conversations with participant data for offline storage
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Fetch all users (excluding current user)
    const users = await getAllUsers(userId);

    // 2. Fetch user's conversations
    const rawConversations = await getUserConversations(userId);

    // 3. Enrich conversations with participant data
    const conversations = await Promise.all(
      rawConversations.map(async (c) => {
        const participants = await getParticipants(c.id);
        const participantUserIds = participants.map((p) => p.user_id);
        const participantUsers = await findUsersByIds(participantUserIds);

        // For private chats, get the other user's info
        let displayName = c.name;
        let avatar = c.group_img;

        if (!c.is_group) {
          const otherParticipant = participants.find(
            (p) => p.user_id !== userId,
          );
          if (otherParticipant) {
            const otherUser = participantUsers.find(
              (u) => u.id === otherParticipant.user_id,
            );
            if (otherUser) {
              displayName = otherUser.name || 'Unknown';
              avatar = otherUser.avatar || null;
            }
          }
        }

        return {
          conversationId: c.id,
          title: displayName || '',
          type: c.is_group ? 'group' : 'private',
          groupImg: avatar || '',
          createdAt: new Date(c.updated_at).getTime(),
          updatedAt: new Date(c.updated_at).getTime(),
          lastMessageId: undefined,
          lastMessage: c.last_message || '',
          lastMessageAt: c.last_message_at
            ? new Date(c.last_message_at).getTime()
            : null,
          unreadCount: c.unread_count || 0,
          participants: participants.map((p) => ({
            odId: `${c.id}_${p.user_id}`,
            odConversationId: c.id,
            odUserId: p.user_id,
            role: 'member' as const,
            unreadCount: 0,
          })),
        };
      }),
    );

    // 4. Format users for local storage
    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name || '',
      avatar: u.avatar || null,
      phoneNumber: u.phoneNumber || '',
      bio: u.bio || '',
      updatedAt: new Date(u.updatedAt).getTime(),
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      conversations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Initial sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Error' },
      { status: 500 },
    );
  }
}
