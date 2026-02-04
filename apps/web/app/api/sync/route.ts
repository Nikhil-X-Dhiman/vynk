import { NextResponse } from 'next/server';
import { db, getUsersDelta } from '@repo/db';
import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';

// GET: Pull Delta (World State Changes)
export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const since = searchParams.get('since')
    ? new Date(searchParams.get('since')!)
    : new Date(0);

  // 1. Fetch changed messages
  const messages = await db
    .selectFrom('message')
    .select([
      'id as messageId',
      'conversation_id as conversationId',
      'sender_id as senderId',
      'content',
      'created_at',
      'updated_at',
    ])
    .where('updated_at', '>', since)
    .where('is_deleted', '=', false)
    .where((eb) =>
      eb.or([
        eb('sender_id', '=', session.user.id),
        eb('conversation_id', 'in', (sub: any) =>
          sub
            .selectFrom('participant')
            .select('conversation_id')
            .where('user_id', '=', session.user.id),
        ),
      ]),
    )
    .execute();

  // 2. Fetch changed stories (active)
  const stories = await db
    .selectFrom('story')
    .select([
      'id as storyId',
      'content_url as contentUrl',
      'expires_at as expiresAt',
      'updated_at',
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
    .where((eb) =>
      eb.or([
        eb('sender_id', '=', session.user.id),
        eb('conversation_id', 'in', (sub: any) =>
          sub
            .selectFrom('participant')
            .select('conversation_id')
            .where('user_id', '=', session.user.id),
        ),
      ]),
    )
    .execute();

  const deletedStories = await db
    .selectFrom('story')
    .select('id')
    .where('updated_at', '>', since)
    .where('is_deleted', '=', true)
    .where('user_id', '=', session.user.id) // Only yours? Or friends? For now yours.
    .execute();

  // 4. Fetch changed conversations (where user is participant)
  const conversations = await db
    .selectFrom('conversation')
    .innerJoin('participant', 'conversation.id', 'participant.conversation_id')
    .select([
      'conversation.id as conversationId',
      'conversation.title',
      'conversation.type',
      'conversation.group_img as groupImg',
      'conversation.group_bio as groupBio',
      'conversation.created_at',
      'conversation.updated_at',
      'conversation.last_message_id as lastMessageId',
      'participant.unread_count as unreadCount',
    ])
    .where('participant.user_id', '=', session.user.id)
    .where('conversation.updated_at', '>', since)
    .where('conversation.is_deleted', '=', false)
    .execute();

  // 5. Fetch Deleted Conversations
  const deletedConvs = await db
    .selectFrom('conversation')
    .innerJoin('participant', 'conversation.id', 'participant.conversation_id')
    .select('conversation.id')
    .where('participant.user_id', '=', session.user.id)
    .where('conversation.updated_at', '>', since)
    .where('conversation.is_deleted', '=', true)
    .execute();

  const deletedConversationIds = deletedConvs.map((c) => c.id);

  // 6. Fetch changed users (for delta sync)
  const users = await getUsersDelta(since, session.user.id);

  return NextResponse.json({
    messages: messages.map((m) => ({
      messageId: m.messageId,
      conversationId: m.conversationId,
      content: m.content || '',
      status: 'sent',
      timestamp: new Date(m.created_at).getTime(),
    })),
    stories: stories.map((s) => ({
      storyId: s.storyId,
      contentUrl: s.contentUrl || '',
      expiresAt: s.expiresAt ? new Date(s.expiresAt).getTime() : 0,
    })),
    users: users.map((u) => ({
      id: u.id,
      name: u.name || '',
      avatar: u.avatar || null,
      phoneNumber: u.phoneNumber || '',
      bio: u.bio || '',
      updatedAt: new Date(u.updatedAt).getTime(),
    })),
    deletedMessageIds: deletedMessages.map((m) => m.id),
    deletedStoryIds: deletedStories.map((s) => s.id),
    deletedConversationIds,
    conversations: conversations.map((c) => ({
      conversationId: c.conversationId,
      title: c.title || '',
      type: c.type,
      groupImg: c.groupImg || '',
      groupBio: c.groupBio || '',
      createdAt: new Date(c.created_at).getTime(),
      updatedAt: new Date(c.updated_at).getTime(),
      lastMessageId: c.lastMessageId || undefined,
      unreadCount: c.unreadCount || 0,
    })),
    timestamp: new Date().toISOString(),
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
            CONVERSATION_CREATE: [] as any[],
            CONVERSATION_UPDATE: [] as any[],
            CONVERSATION_DELETE: [] as string[],
        };

        const itemIds = {
            MESSAGE_SEND: [] as number[],
            MESSAGE_DELETE: [] as number[],
            STORY_CREATE: [] as number[],
            STORY_DELETE: [] as number[],
            REACTION_ADD: [] as number[],
            CONVERSATION_CREATE: [] as number[],
            CONVERSATION_UPDATE: [] as number[],
            CONVERSATION_DELETE: [] as number[],
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
            } else if (action === 'CONVERSATION_CREATE' && payload.type) {
                groups.CONVERSATION_CREATE.push(payload);
                itemIds.CONVERSATION_CREATE.push(queueId);
            } else if (action === 'CONVERSATION_UPDATE' && payload.conversationId) {
                groups.CONVERSATION_UPDATE.push(payload);
                itemIds.CONVERSATION_UPDATE.push(queueId);
            } else if (action === 'CONVERSATION_DELETE' && payload.conversationId) {
                groups.CONVERSATION_DELETE.push(payload.conversationId);
                itemIds.CONVERSATION_DELETE.push(queueId);
            }
        }

        const results: any[] = [];
        const processGroup = (ids: number[], success: boolean, err?: string) => {
            ids.forEach(id => {
                results.push({ id, status: success ? 'success' : 'failed', error: err });
            });
        };

        // ... [Existing Message & Story Handlers] ...
        // 1. Bulk Insert Messages
        if (groups.MESSAGE_SEND.length > 0) {
             try {
                const rows = groups.MESSAGE_SEND.map(p => ({
                    id: p.id || p.messageId,
                    conversation_id: p.conversationId,
                    sender_id: userId,
                    content: p.content,
                    media_type: p.mediaType || 'text',
                    created_at: p.timestamp ? new Date(p.timestamp) : new Date(),
                    updated_at: new Date(),
                })).filter(r => r.id);

                if (rows.length > 0) {
                     await db.insertInto('message')
                        .values(rows)
                        .onConflict((oc) => oc.column('id').doNothing())
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
                    .where('sender_id', '=', userId)
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
                 processGroup(itemIds.STORY_DELETE, false, String(error));
            }
        }

        // 5. Bulk Reactions
        if (groups.REACTION_ADD.length > 0) {
             try {
                const rows = groups.REACTION_ADD.map(p => ({
                    id: crypto.randomUUID(),
                    message_id: p.messageId || null,
                    story_id: p.storyId || null,
                    user_id: userId,
                    emoji: p.emoji,
                    created_at: new Date(),
                }));
                await db.insertInto('reaction')
                    .values(rows)
                    .onConflict((oc) => oc.columns(['message_id', 'user_id']).doUpdateSet((eb) => ({ emoji: eb.ref('excluded.emoji') })))
                    .execute();
                processGroup(itemIds.REACTION_ADD, true);
             } catch (error) {
                 processGroup(itemIds.REACTION_ADD, false, String(error));
             }
        }

        // 6. Bulk Create Conversations
        if (groups.CONVERSATION_CREATE.length > 0) {
            try {
                // We need to insert conversations AND participants.
                // Kysely doesn't do "bulk insert into multiple tables" natively in one call,
                // so we loop or transaction. For now, loop safely or strict grouping.
                // Given conversation creation is rare compared to messages, a loop is acceptable safety-wise here,
                // BUT let's try to map it.
                // Issue: participants array in payload.

                // Falling back to sequential loop for complex structure to ensure integrity
                for (let i = 0; i < groups.CONVERSATION_CREATE.length; i++) {
                    const p = groups.CONVERSATION_CREATE[i];
                    const qId = itemIds.CONVERSATION_CREATE[i];
                    try {
                        await db.transaction().execute(async (trx) => {
                             await trx.insertInto('conversation')
                                .values({
                                    id: p.id || p.conversationId,
                                    type: p.type,
                                    title: p.title,
                                    created_by: userId,
                                    created_at: p.createdAt ? new Date(p.createdAt) : new Date(),
                                    updated_at: new Date(),
                                })
                                .onConflict((oc) => oc.column('id').doNothing())
                                .execute();

                             // Add Self
                             await trx.insertInto('participant')
                                .values({
                                    id: crypto.randomUUID(),
                                    conversation_id: p.id || p.conversationId,
                                    user_id: userId,
                                    role: 'admin',
                                    joined_at: new Date(),
                                    updated_at: new Date()
                                })
                                .onConflict((oc) => oc.doNothing())
                                .execute();

                             // Add Others
                             if (p.participants && Array.isArray(p.participants)) {
                                 const otherParts = p.participants.map((uid: string) => ({
                                     id: crypto.randomUUID(),
                                     conversation_id: p.id || p.conversationId,
                                     user_id: uid,
                                     role: 'member', // Default
                                     joined_at: new Date(),
                                     updated_at: new Date()
                                 })).filter((Part: any) => Part.user_id !== userId);

                                 if (otherParts.length > 0) {
                                     await trx.insertInto('participant')
                                        .values(otherParts)
                                        .onConflict((oc) => oc.doNothing())
                                        .execute();
                                 }
                             }
                        });
                        results.push({ id: qId, status: 'success' });
                    } catch (err) {
                        console.error('Conv Create Failed', err);
                        results.push({ id: qId, status: 'failed', error: String(err) });
                    }
                }
            } catch (error) {
                 // Wrapper error
                 console.error('Batch Conv Create Loop Error', error);
            }
        }

        // 7. Bulk Update Conversations
        if (groups.CONVERSATION_UPDATE.length > 0) {
             // Updates are usually specific, best to loop or complex CASE
             for (let i = 0; i < groups.CONVERSATION_UPDATE.length; i++) {
                 const p = groups.CONVERSATION_UPDATE[i];
                 const qId = itemIds.CONVERSATION_UPDATE[i];
                 try {
                     await db.updateTable('conversation')
                        .set({
                            title: p.title, // Only update if provided?
                            group_img: p.groupImg,
                            group_bio: p.groupBio,
                            updated_at: new Date()
                        })
                        .where('id', '=', p.conversationId)
                        // Optional: Check if user is admin? For now assume valid source.
                        .execute();
                     results.push({ id: qId, status: 'success' });
                 } catch (err) {
                     results.push({ id: qId, status: 'failed', error: String(err) });
                 }
             }
        }

        // 8. Bulk Delete Conversations (Soft Delete)
        if (groups.CONVERSATION_DELETE.length > 0) {
             try {
                // Soft delete so other clients can sync the deletion
                await db.updateTable('conversation')
                    .set({ is_deleted: true, updated_at: new Date() })
                    .where('id', 'in', groups.CONVERSATION_DELETE)
                    .where('created_by', '=', userId) // Strict ownership
                    .execute();

                processGroup(itemIds.CONVERSATION_DELETE, true);
             } catch (error) {
                 processGroup(itemIds.CONVERSATION_DELETE, false, String(error));
             }
        }

        // Fill skipped
        const processedIds = new Set(results.map(r => r.id));
        items.forEach((item: any) => {
            if (!processedIds.has(item.id)) {
                results.push({ id: item.id, status: 'failed', error: 'Invalid Payload / Skipped' });
            }
        });

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Sync Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
