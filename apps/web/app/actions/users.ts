'use server';

import { findUsersByIds } from '@repo/db';

export async function getUsersByIds(userIds: string[]) {
  try {
    if (!userIds.length) return { success: true, data: [] };

    const users = await findUsersByIds(userIds);

    return { success: true, data: users };
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}
