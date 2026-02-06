import { db } from '../../kysely/db';

type UpdateUserProfileParams = {
  userId: string;
  userName?: string;
  bio?: string;
  avatarUrl?: string;
};

type UpdateUserProfileResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Updates a user's profile information.
 * Only updates fields that are provided.
 *
 * @param params - User ID and optional fields to update
 * @returns Success or error
 */
async function updateUserProfile(
  params: UpdateUserProfileParams
): Promise<UpdateUserProfileResult> {
  const { userId, userName, bio, avatarUrl } = params;

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    updated_at: new Date(),
  };

  if (userName !== undefined) {
    updateData.user_name = userName;
  }
  if (bio !== undefined) {
    updateData.bio = bio;
  }
  if (avatarUrl !== undefined) {
    updateData.avatar_url = avatarUrl;
  }

  try {
    await db
      .updateTable('user')
      .set(updateData)
      .where('id', '=', userId)
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

type DeleteUserResult =
  | { success: true; data: { deleted: boolean } }
  | { success: false; error: string };

/**
 * Deletes a user account.
 * Note: This is a hard delete. Consider cascade implications.
 *
 * @param userId - The user ID to delete
 * @returns Success with deletion status or error
 */
async function deleteUser(userId: string): Promise<DeleteUserResult> {
  try {
    const result = await db
      .deleteFrom('user')
      .where('id', '=', userId)
      .executeTakeFirst();

    return {
      success: true,
      data: { deleted: Number(result.numDeletedRows) > 0 },
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

export { updateUserProfile, deleteUser };
export type {
  UpdateUserProfileParams,
  UpdateUserProfileResult,
  DeleteUserResult,
};
