'use server';

import { getParticipants, getConversation as dbGetConversation, findUsersByIds, findPrivateConversation, createConversation } from '@repo/db';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@repo/db';
import { revalidatePath } from 'next/cache';

export async function startConversation(targetUserId: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        const userId = session.user.id;

        // 1. Check if conversation exists
        const existing = await findPrivateConversation(userId, targetUserId);
        if (existing) {
            return { success: true, data: existing.id };
        }

        // Wait, 'daa'? I should fix that typo.
        // Also I need user details to create conversation properly?
        // Actually createConversation helper takes createdByUserId and participantInfo.
        // It also needs group info, but for private chat it's ignored or can be empty.

        const newConv = await createConversation({
            type: 'private',
            title: '', // Private chats usually don't have titles stored
            createdByUserId: userId,
            groupImg: '',
            groupDesc: '',
            participantInfo: [
                { userId: userId, role: 'admin' }, // Or member
                { userId: targetUserId, role: 'member' }
            ]
        });

        if (newConv.success && newConv.data) {
             revalidatePath('/chats');
             return { success: true, data: newConv.data };
        }
        return { success: false, error: 'Failed' };

    } catch (error) {
        console.error('Start Conversation Error:', error);
        return { success: false, error: 'Internal Error' };
    }
}

export async function getConversationDetails(conversationId: string) {
  try {
     const session = await auth.api.getSession({
        headers: await headers()
     });

     if (!session) {
         return { success: false, error: 'Unauthorized' };
     }

     const conversation = await dbGetConversation(conversationId);
     if (!conversation) return { success: false, error: 'Not Found' };

     // We also need participants to know who the "Other" user is.
     // Fetch participants for this conversation.
     // We should probably have a db helper for this, but for now direct query or helper if exists.
     // Let's assume we can query 'participant' table correctly.
     // Oops, we are trying to separate DB logic.
     // I'll check if 'participant' module exists in db package.

     const participants = await getParticipants(conversationId);

     const otherParticipant = participants.find(p => p.user_id !== session.user.id);

     let otherUser = null;
     if (otherParticipant) {
         const users = await findUsersByIds([otherParticipant.user_id]);
         otherUser = users[0];
     }

     return {
         success: true,
         data: {
             ...conversation,
             otherUser
         }
     };
  } catch (error) {
    console.error('Failed to get conversation:', error);
    return { success: false, error: 'Failed to fetch conversation' };
  }
}
