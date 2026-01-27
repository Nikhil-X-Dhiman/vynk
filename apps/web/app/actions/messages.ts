'use server';

import { getMessages as dbGetMessages } from '@repo/db';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth-server';

export async function getMessages(conversationId: string) {
  try {
     const session = await auth.api.getSession({
        headers: await headers()
     });

     if (!session) {
         return { success: false, error: 'Unauthorized' };
     }

     const messages = await dbGetMessages(conversationId);

     // Reverse to show oldest first if UI expects that (or keep desc and UI handles it)
     return { success: true, data: messages.reverse() };
  } catch (error) {
    console.error('Failed to get messages:', error);
    return { success: false, error: 'Failed to fetch messages' };
  }
}
