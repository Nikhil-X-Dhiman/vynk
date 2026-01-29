import { NextResponse } from 'next/server';
import { db } from '@repo/db';
import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { action, payload } = await req.json();

    switch (action) {
      case 'MESSAGE_SEND':
        // payload: { conversationId, content, timestamp, mediaType }
        await db.insertInto('message')
          .values({
             conversation_id: payload.conversationId,
             sender_id: session.user.id,
             content: payload.content,
             created_at: new Date(payload.timestamp),
             media_type: payload.mediaType || 'text',
             updated_at: new Date(),
          })
          .execute();
        break;

      case 'MESSAGE_READ':
         // payload: { conversationId, messageId }
         if (payload.conversationId && payload.messageId) {
             await db.updateTable('participant')
               .set({
                   last_read_message_id: payload.messageId,
                   updated_at: new Date()
               })
               .where('conversation_id', '=', payload.conversationId)
               .where('user_id', '=', session.user.id)
               .execute();
         }
        break;

      case 'MESSAGE_DELETE':
         // payload: { messageId }
         if (payload.messageId) {
            await db.updateTable('message')
                .set({ is_deleted: true })
                .where('id', '=', payload.messageId)
                .where('sender_id', '=', session.user.id)
                .execute();
         }
        break;

      case 'STORY_CREATE':
        // payload: { contentUrl, type, text, caption, expiresAt }
        await db.insertInto('story')
          .values({
              user_id: session.user.id,
              content_url: payload.contentUrl,
              type: payload.type || 'text',
              text: payload.text,
              caption: payload.caption,
              expires_at: new Date(payload.expiresAt),
              created_at: new Date(),
          })
          .execute();
        break;

      case 'STORY_DELETE':
         if (payload.storyId) {
             await db.deleteFrom('story')
               .where('id', '=', payload.storyId)
               .where('user_id', '=', session.user.id)
               .execute();
         }
        break;

      case 'STORY_READ':
         if (payload.storyId) {
             await db.insertInto('story_view')
               .values({
                   story_id: payload.storyId,
                   user_id: session.user.id,
                   viewed_at: new Date(),
                   created_at: new Date(),
                   updated_at: new Date(),
               })
               .onConflict((oc) => oc.columns(['user_id', 'story_id']).doNothing())
               .execute();
         }
         break;

      case 'REACTION_ADD':
         // payload: { messageId?, storyId?, emoji }
         await db.insertInto('reaction')
           .values({
               message_id: payload.messageId || null,
               story_id: payload.storyId || null,
               user_id: session.user.id,
               emoji: payload.emoji,
               created_at: new Date(),
           })
           // Note: onConflict applies if there's a unique constraint.
           // Message reactions have one ([messageId, userId]), Story reactions currently don't in Schema?
           // We'll safely attempt update for messageId if present.
           .onConflict((oc) => {
               // Only for message reactions based on current schema
               if (payload.messageId) {
                  return oc.columns(['message_id', 'user_id']).doUpdateSet({ emoji: payload.emoji });
               }
               return oc.doNothing(); // Fallback
           })
           .execute();
         break;

      case 'REACTION_REMOVE':
          // payload: { messageId?, storyId? }
          let q = db.deleteFrom('reaction').where('user_id', '=', session.user.id);
          if (payload.messageId) q = q.where('message_id', '=', payload.messageId);
          if (payload.storyId) q = q.where('story_id', '=', payload.storyId);
          await q.execute();
          break;

      default:
        console.warn('Unknown sync action:', action);
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
