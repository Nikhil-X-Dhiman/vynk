'use server';

import { getSettings as dbGetSettings, updateSettings as dbUpdateSettings } from '@repo/db';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth-server';

export async function getSettings(userId?: string) {
  try {
     const session = await auth.api.getSession({
        headers: await headers()
     });

     if (!session) {
         return { success: false, error: 'Unauthorized' };
     }

     // If userId passed, check if it matches session or if user is admin (optional).
     // For now, default to session user.
     const targetUserId = userId || session.user.id;

    const settings = await dbGetSettings(targetUserId);

    return { success: true, data: settings || null };
  } catch (error) {
    console.error('Failed to get settings:', error);
    return { success: false, error: 'Failed to fetch settings' };
  }
}

export async function updateSettings(userId: string | undefined, data: { theme?: string; notifications?: boolean; soundEnabled?: boolean }) {
  try {
     const session = await auth.api.getSession({
        headers: await headers()
     });

     if (!session) {
         return { success: false, error: 'Unauthorized' };
     }

     const targetUserId = userId || session.user.id;

     if (targetUserId !== session.user.id) {
         // Prevent updating others
         return { success: false, error: 'Forbidden' };
     }

    await dbUpdateSettings(targetUserId, data);

    return { success: true };
  } catch (error) {
    console.error('Failed to update settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}
