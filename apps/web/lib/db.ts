import Dexie, { Table } from 'dexie';

export interface LocalMessage {
  id?: number; // Local ID
  messageId?: string; // Server ID (UUID)
  conversationId: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'seen';
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'failed' | 'deleted';
}

export interface LocalStory {
  id?: number;
  contentUrl: string;
  expiresAt: number;
  syncStatus: 'pending' | 'synced' | 'failed' | 'deleted';
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

export class VynkLocalDB extends Dexie {
  messages!: Table<LocalMessage>;
  stories!: Table<LocalStory>;
  queue!: Table<QueueItem>;

  constructor() {
    super('VynkLocalDB');
    this.version(1).stores({
      messages: '++id, conversationId, status, syncStatus, timestamp',
      stories: '++id, expiresAt, syncStatus',
      settings: 'id',
      calls: '++id, status',
      queue: '++id, action, timestamp'
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

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
       try {
         const reg = await navigator.serviceWorker.ready;
         // @ts-ignore
         await reg.sync.register('sync-queue');
       } catch (err) {
         console.warn('Sync registration failed', err);
       }
    }
  }
}

export const db = new VynkLocalDB();
