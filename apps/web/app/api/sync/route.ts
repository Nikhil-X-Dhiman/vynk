import { NextResponse } from 'next/server';
import { db } from '@repo/db';
import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';

// GET: Pull Delta (World State Changes)
export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since') ? new Date(searchParams.get('since')!) : new Date(0);

    // 1. Fetch changed messages
    const messages = await db
        .selectFrom('message')
        .select([
            'id as messageId',
            'conversation_id as conversationId',
            'sender_id as senderId',
            'content',
            'created_at',
            'updated_at'
        ])
        .where('updated_at', '>', since)
        .where('is_deleted', '=', false)
        .where((eb) => eb.or([
            eb('sender_id', '=', session.user.id),
            eb('conversation_id', 'in', (sub: any) =>
                sub.selectFrom('participant')
                   .select('conversation_id')
                   .where('user_id', '=', session.user.id)
            )
        ]))
        .execute();

    // 2. Fetch changed stories (active)
    const stories = await db
        .selectFrom('story')
        .select([
            'id as storyId',
            'content_url as contentUrl',
            'expires_at as expiresAt',
            'updated_at'
        ])
        .where('updated_at', '>', since)
        .where('is_deleted', '=', false)
        .execute();

    // 3. Fetch deleted IDs (filtered by user access)
    const deletedMessages = await db
        .selectFrom('message')
        .select('id')
        .where('updated_at', '>', since)
        .where('is_deleted', '=', true)
        .where((eb) => eb.or([
            eb('sender_id', '=', session.user.id),
            eb('conversation_id', 'in', (sub: any) =>
                sub.selectFrom('participant')
                   .select('conversation_id')
                   .where('user_id', '=', session.user.id)
            )
        ]))
        .execute();

    const deletedStories = await db
        .selectFrom('story')
        .select('id')
        .where('updated_at', '>', since)
        .where('is_deleted', '=', true)
        .where('user_id', '=', session.user.id) // Only yours? Or friends? For now yours.
        .execute();

    return NextResponse.json({
        messages: messages.map(m => ({
            messageId: m.messageId,
            conversationId: m.conversationId,
            content: m.content || '',
            status: 'sent',
            timestamp: new Date(m.created_at).getTime()
        })),
        stories: stories.map(s => ({
            storyId: s.storyId,
            contentUrl: s.contentUrl || '',
            expiresAt: s.expiresAt ? new Date(s.expiresAt).getTime() : 0
        })),
        deletedMessageIds: deletedMessages.map(m => m.id),
        deletedStoryIds: deletedStories.map(s => s.id),
        timestamp: new Date().toISOString()
    });
}

// POST: Batch Flush (Push Queue)
export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const items = await req.json(); // Array of QueueItems
        const userId = session.user.id;

        // Group actions by type
        const groups = {
            MESSAGE_SEND: [] as any[],
            MESSAGE_DELETE: [] as string[],
            STORY_CREATE: [] as any[],
            STORY_DELETE: [] as string[],
            REACTION_ADD: [] as any[],
        };

        const itemIds = {
            MESSAGE_SEND: [] as number[],
            MESSAGE_DELETE: [] as number[],
            STORY_CREATE: [] as number[],
            STORY_DELETE: [] as number[],
            REACTION_ADD: [] as number[],
        };

        // Categorize items
        for (const item of items) {
            const { action, payload, id: queueId } = item;
            if (action === 'MESSAGE_SEND' && payload.conversationId && payload.content) {
                groups.MESSAGE_SEND.push(payload);
                itemIds.MESSAGE_SEND.push(queueId);
            } else if (action === 'MESSAGE_DELETE' && payload.messageId) {
                groups.MESSAGE_DELETE.push(payload.messageId);
                itemIds.MESSAGE_DELETE.push(queueId);
            } else if (action === 'STORY_CREATE' && payload.contentUrl) {
                groups.STORY_CREATE.push(payload);
                itemIds.STORY_CREATE.push(queueId);
            } else if (action === 'STORY_DELETE' && payload.storyId) {
                groups.STORY_DELETE.push(payload.storyId);
                itemIds.STORY_DELETE.push(queueId);
            } else if (action === 'REACTION_ADD' && (payload.messageId || payload.storyId) && payload.emoji) {
                groups.REACTION_ADD.push(payload);
                itemIds.REACTION_ADD.push(queueId);
            }
        }

        const results: any[] = [];
        const processGroup = (ids: number[], success: boolean, err?: string) => {
            ids.forEach(id => {
                results.push({ id, status: success ? 'success' : 'failed', error: err });
            });
        };

        // 1. Bulk Insert Messages
        if (groups.MESSAGE_SEND.length > 0) {
            try {
                // Ensure unique IDs from client or fallback to autogen (though client should send compatible UUIDs)
                // Note: If payload.id is present, Kysely uses it. If not, DB generates.
                // For proper sync, client MUST send a UUID as 'id' or 'messageId'.
                // Mapping payload to DB columns
                const rows = groups.MESSAGE_SEND.map(p => ({
                    id: p.id || p.messageId, // Prefer explicit ID
                    conversation_id: p.conversationId,
                    sender_id: userId,
                    content: p.content,
                    media_type: p.mediaType || 'text',
                    created_at: p.timestamp ? new Date(p.timestamp) : new Date(),
                    updated_at: new Date(),
                })).filter(r => r.id); // Filter out if no ID provided and we strictly want client IDs (optional)

                if (rows.length > 0) {
                     await db.insertInto('message')
                        .values(rows)
                        .onConflict((oc) => oc.column('id').doNothing()) // Idempotency
                        .execute();
                }
                processGroup(itemIds.MESSAGE_SEND, true);
            } catch (error) {
                console.error('Batch Message Send Failed', error);
                processGroup(itemIds.MESSAGE_SEND, false, String(error));
            }
        }

        // 2. Bulk Delete Messages
        if (groups.MESSAGE_DELETE.length > 0) {
            try {
                await db.updateTable('message')
                    .set({ is_deleted: true, updated_at: new Date() })
                    .where('id', 'in', groups.MESSAGE_DELETE)
                    .where('sender_id', '=', userId) // Security check
                    .execute();
                processGroup(itemIds.MESSAGE_DELETE, true);
            } catch (error) {
                console.error('Batch Message Delete Failed', error);
                processGroup(itemIds.MESSAGE_DELETE, false, String(error));
            }
        }

        // 3. Bulk Create Stories
        if (groups.STORY_CREATE.length > 0) {
             try {
                const rows = groups.STORY_CREATE.map(p => ({
                    id: p.id || p.storyId,
                    user_id: userId,
                    content_url: p.contentUrl,
                    type: p.type || 'text',
                    text: p.text,
                    caption: p.caption,
                    expires_at: new Date(p.expiresAt),
                    is_deleted: false,
                    created_at: new Date(),
                    updated_at: new Date(),
                })).filter(r => r.id);

                if (rows.length > 0) {
                    await db.insertInto('story')
                        .values(rows)
                        .onConflict((oc) => oc.column('id').doNothing())
                        .execute();
                }
                processGroup(itemIds.STORY_CREATE, true);
             } catch (error) {
                console.error('Batch Story Create Failed', error);
                processGroup(itemIds.STORY_CREATE, false, String(error));
             }
        }

        // 4. Bulk Delete Stories
        if (groups.STORY_DELETE.length > 0) {
            try {
                await db.updateTable('story')
                    .set({ is_deleted: true, updated_at: new Date() })
                    .where('id', 'in', groups.STORY_DELETE)
                    .where('user_id', '=', userId)
                    .execute();
                processGroup(itemIds.STORY_DELETE, true);
            } catch (error) {
                 console.error('Batch Story Delete Failed', error);
                 processGroup(itemIds.STORY_DELETE, false, String(error));
            }
        }

        // 5. Bulk Reactions (Upsert)
        // Reactions are trickier because of the unique constraint on (messageId, userId).
        // Standard bulk insert with onConflict works well here.
        if (groups.REACTION_ADD.length > 0) {
            try {
                const rows = groups.REACTION_ADD.map(p => ({
                    message_id: p.messageId || null,
                    story_id: p.storyId || null,
                    user_id: userId,
                    emoji: p.emoji,
                    created_at: new Date(),
                }));

                await db.insertInto('reaction')
                    .values(rows)
                    .onConflict((oc) =>
                        oc.columns(['message_id', 'user_id']) // Assuming this constraint exists
                          .doUpdateSet((eb) => ({
                              emoji: eb.ref('excluded.emoji')
                          }))
                    )
                    .execute();
                processGroup(itemIds.REACTION_ADD, true);
            } catch (error) {
                console.error('Batch Reaction Add Failed', error);
                processGroup(itemIds.REACTION_ADD, false, String(error));
            }
        }

        // Fill in any skipped items (e.g. invalid payload) as failed or just ignored?
        // For now, we only processed items that made it into groups.
        // We should double check if we missed any from the categorization loop in case of bad payload.
        // The loop filtered bad payloads logic -> missed items won't be in 'results'.
        // Let's add them as failed to be safe.
        const processedIds = new Set(results.map(r => r.id));
        items.forEach((item: any) => {
            if (!processedIds.has(item.id)) {
                results.push({ id: item.id, status: 'failed', error: 'Invalid Payload' });
            }
        });

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Sync Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
