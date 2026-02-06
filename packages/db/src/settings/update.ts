import { randomUUID } from 'crypto';
import { db } from '../../kysely/db';

type UpdateSettingsParams = {
  userId: string;
  theme?: string;
  notifications?: boolean;
  soundEnabled?: boolean;
};

type UpdateSettingsResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Creates or updates user settings using upsert pattern.
 * Only updates fields that are provided (partial update).
 *
 * @param params - User ID and optional settings fields
 * @returns Success or error
 */
async function updateSettings(
  params: UpdateSettingsParams,
): Promise<UpdateSettingsResult> {
  const { userId, theme, notifications, soundEnabled } = params;

  try {
    await db
      .insertInto('settings')
      .values({
        id: randomUUID(),
        user_id: userId,
        theme: theme ?? 'system',
        notifications: notifications ?? true,
        sound_enabled: soundEnabled ?? true,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.column('user_id').doUpdateSet((eb) => ({
          // Only update fields that were explicitly provided
          theme: theme !== undefined ? eb.val(theme) : eb.ref('settings.theme'),
          notifications:
            notifications !== undefined
              ? eb.val(notifications)
              : eb.ref('settings.notifications'),
          sound_enabled:
            soundEnabled !== undefined
              ? eb.val(soundEnabled)
              : eb.ref('settings.sound_enabled'),
          updated_at: new Date(),
        })),
      )
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}

/**
 * Deletes user settings (used when user account is deleted).
 *
 * @param userId - The user ID
 * @returns Success or error
 */
async function deleteSettings(userId: string): Promise<UpdateSettingsResult> {
  try {
    await db.deleteFrom('settings').where('user_id', '=', userId).execute();

    return { success: true };
  } catch (error) {
    console.error('Error deleting settings:', error);
    return { success: false, error: 'Failed to delete settings' };
  }
}

export { updateSettings, deleteSettings };
export type { UpdateSettingsParams, UpdateSettingsResult };
