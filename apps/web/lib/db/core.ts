import Dexie, { Table } from 'dexie'
import {
  LocalConversation,
  LocalMessage,
  LocalStory,
  LocalUser,
  LocalParticipant,
  QueueItem,
  Meta,
} from './types'

export class VynkLocalDB extends Dexie {
  messages!: Table<LocalMessage>
  stories!: Table<LocalStory>
  conversations!: Table<LocalConversation>
  queue!: Table<QueueItem>
  meta!: Table<Meta>
  users!: Table<LocalUser>
  participants!: Table<LocalParticipant>

  constructor() {
    super('VynkLocalDB')

    // Version 3: Add participants table and enhance conversations
    this.version(3).stores({
      messages: '++id, messageId, conversationId, timestamp',
      stories: '++id, storyId, expiresAt',
      conversations: '++id, conversationId, updatedAt, type',
      queue: '++id, action, timestamp',
      meta: 'key',
      settings: 'id',
      calls: '++id, status',
      users: 'id, name, updatedAt',
      participants: 'id, conversationId, userId',
    })
  }

  async cleanupOldStories() {
    const now = Date.now()
    await this.stories.where('expiresAt').below(now).delete()
  }

  async clearAllData() {
    await this.messages.clear()
    await this.stories.clear()
    await this.conversations.clear()
    await this.users.clear()
    await this.participants.clear()
    await this.queue.clear()
    await this.meta.clear()
  }
}

export const db = new VynkLocalDB()
