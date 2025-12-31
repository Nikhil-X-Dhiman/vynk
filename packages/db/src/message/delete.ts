import { db } from '../../kysely/db';

async function deleteMessage(messageId: string) {
  const result = await db
    .deleteFrom('message')
    .where('message.id', '=', messageId)
    .executeTakeFirst();
  return result.numDeletedRows;
}

export { deleteMessage };
