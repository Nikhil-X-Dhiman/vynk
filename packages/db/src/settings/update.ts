import { db } from '../../kysely/db';

export async function updateSettings(
  userId: string,
  data: { theme?: string; notifications?: boolean; soundEnabled?: boolean }
) {
  return await db
    .insertInto('settings')
    .values({
      id: crypto.randomUUID(),
      user_id: userId,
      theme: data.theme ?? 'system',
      notifications: data.notifications ?? true,
      sound_enabled: data.soundEnabled ?? true,
      updated_at: new Date(),
    })
    .onConflict((oc) =>
      oc.column('user_id').doUpdateSet({
        theme: (eb: any) => (data.theme ? eb.val(data.theme) : eb.ref('theme')),
        notifications: (eb: any) =>
          data.notifications !== undefined ? eb.val(data.notifications) : eb.ref('notifications'),
        sound_enabled: (eb: any) =>
          data.soundEnabled !== undefined ? eb.val(data.soundEnabled) : eb.ref('sound_enabled'),
        updated_at: new Date(),
      })
    )
    .execute();
}
