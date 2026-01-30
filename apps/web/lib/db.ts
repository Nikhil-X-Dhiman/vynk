import Dexie, { Table } from 'dexie';

export interface LocalMessage {
  id?: number;
  messageId?: string; // Server ID
  conversationId: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'seen';
  timestamp: number;
}

export interface LocalStory {
  id?: number;
  storyId?: string;
  contentUrl: string;
  expiresAt: number;
}

export type SyncAction =
  | 'MESSAGE_SEND'
  | 'MESSAGE_READ'
  | 'MESSAGE_DELETE'
  | 'STORY_CREATE'
  | 'STORY_READ'
  | 'STORY_DELETE'
  | 'REACTION_ADD'
  | 'REACTION_REMOVE';

export interface QueueItem {
  id?: number;
  action: SyncAction;
  payload: any;
  timestamp: number;
}

export interface Meta {
  key: string;
  value: any;
}

export class VynkLocalDB extends Dexie {
  messages!: Table<LocalMessage>;
  stories!: Table<LocalStory>;
  queue!: Table<QueueItem>;
  meta!: Table<Meta>;

  constructor() {
    super('VynkLocalDB');
    this.version(1).stores({
      messages: '++id, conversationId, timestamp',
      stories: '++id, expiresAt',
      queue: '++id, action, timestamp',
      settings: 'id',
      calls: '++id, status',
    });

    this.version(2).stores({
      messages: '++id, conversationId, timestamp',
      stories: '++id, expiresAt',
      queue: '++id, action, timestamp',
      meta: 'key',
      settings: 'id',
      calls: '++id, status',
    });
  }

  async cleanupOldStories() {
    const now = Date.now();
    await this.stories.where('expiresAt').below(now).delete();
  }

  async enqueue(action: SyncAction, payload: any) {
    await this.queue.add({
      action,
      payload,
      timestamp: Date.now(),
    });
    // Trigger sync immediately if online
    if (navigator.onLine) {
        this.sync().catch(console.error);
    }
  }

  async sync() {
      if (!navigator.onLine) return;

      try {
          await this.flushQueue();
          await this.pullDelta();
      } catch (err) {
          console.error('Sync failed', err);
      }
  }

  async flushQueue() {
      const items = await this.queue.orderBy('timestamp').toArray();
      if (items.length === 0) return;

      const response = await fetch('/api/sync', {
          method: 'POST',
          body: JSON.stringify(items),
          headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Flush failed');

      const result = await response.json();
      if (result.success) {
          // Clear processed items
          const ids = items.map(i => i.id!);
          await this.queue.bulkDelete(ids);
      }
  }

  async pullDelta() {
      const meta = await this.meta.get('lastSyncedAt');
      const lastSyncedAt = meta?.value || new Date(0).toISOString();

      const response = await fetch(`/api/sync?since=${lastSyncedAt}`);
      if (!response.ok) throw new Error('Pull failed');

      const data = await response.json();
      // data: { messages, stories, deletedMessageIds, deletedStoryIds, timestamp }

      await this.transaction('rw', this.messages, this.stories, this.meta, async () => {
          // 1. Apply Changes (Upsert)
          if (data.messages?.length) {
              for (const msg of data.messages) {
                  const existing = await this.messages.where('messageId').equals(msg.messageId).first();
                  if (existing) {
                      await this.messages.update(existing.id!, msg);
                  } else {
                      await this.messages.add(msg);
                  }
              }
          }
          if (data.stories?.length) {
              for (const story of data.stories) {
                  const existing = await this.stories.where('storyId').equals(story.storyId).first();
                  if (existing) {
                      await this.stories.update(existing.id!, story);
                  } else {
                      await this.stories.add(story);
                  }
              }
          }

          // 2. Handle Deletions
          if (data.deletedMessageIds?.length) {
              await this.messages.where('messageId').anyOf(data.deletedMessageIds).delete();
          }
          if (data.deletedStoryIds?.length) {
             await this.stories.where('storyId').anyOf(data.deletedStoryIds).delete();
          }

          // 3. Update Timestamp
          await this.meta.put({ key: 'lastSyncedAt', value: data.timestamp });
      });
  }
}

export const db = new VynkLocalDB();
