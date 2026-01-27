'use server';

import { getUserConversations as dbGetUserConversations, getParticipants, findUsersByIds } from '@repo/db';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth-server';

export async function getUserConversations() {
  try {
     const session = await auth.api.getSession({
        headers: await headers()
     });

     if (!session) {
         return { success: false, error: 'Unauthorized' };
     }

     const conversations = await dbGetUserConversations(session.user.id);

     // Enrich with Other User details for 1:1 chats
     const enrichedConversations = await Promise.all(conversations.map(async (c) => {
         let avatar = c.is_group ? c.group_img : null;
         let name = c.name;

         if (!c.is_group) {
             const participants = await getParticipants(c.id);
             const otherParticipant = participants.find(p => p.user_id !== session.user.id);
             if (otherParticipant) {
                 const users = await findUsersByIds([otherParticipant.user_id]);
                 const otherUser = users[0];
                 name = otherUser?.name || 'Unknown';
                 avatar = otherUser?.avatar;
             }
         }

         return {
             ...c,
             isGroup: c.is_group,
             name,
             avatar,
             lastMessage: c.last_message || (c.media_type ? 'Sent an attachment' : 'No messages yet'),
             time: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
             unreadCount: c.unread_count
         };
     }));

     return { success: true, data: enrichedConversations };
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return { success: false, error: 'Failed to fetch conversations' };
  }
}
