import { db } from '../../kysely/db';

type Settings = {
  id: string;
  user_id: string;
  theme: string;
  notifications: boolean;
  sound_enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

type GetSettingsResult =
  | { success: true; data: Settings | undefined }
  | { success: false; error: string };

/**
 * Gets user settings.
 *
 * @param userId - The user ID
 * @returns Settings data or undefined if not found
 */
async function getSettings(userId: string): Promise<GetSettingsResult> {
  try {
    const settings = await db
      .selectFrom('settings')
      .select([
        'id',
        'user_id',
        'theme',
        'notifications',
        'sound_enabled',
        'created_at',
        'updated_at',
      ])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return { success: true, data: settings as Settings | undefined };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { success: false, error: 'Failed to fetch settings' };
  }
}

export { getSettings };
export type { Settings, GetSettingsResult };
