import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pullDelta } from '../sync';
import { db } from '../core';

// Mock fetch globally
global.fetch = vi.fn();

describe('DB Sync (pullDelta)', () => {
  beforeEach(async () => {
    await db.clearAllData();
    vi.clearAllMocks();
  });

  it('should explicitly return if offline', async () => {
    // Simulate offline
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: { onLine: false },
      writable: true,
    });

    await pullDelta(db);

    expect(fetch).not.toHaveBeenCalled();

    // Restore
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  it('should fetch delta and update DB', async () => {
    // Mock successful response
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        timestamp: new Date().toISOString(),
        conversations: [{ id: 1, conversationId: 'c1', name: 'Chat 1' }],
        messages: [
          {
            id: 'm1',
            conversationId: 'c1',
            content: 'Hello',
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    });

    await pullDelta(db);

    const convs = await db.conversations.toArray();
    const msgs = await db.messages.toArray();

    expect(convs).toHaveLength(1);
    expect(convs[0].conversationId).toBe('c1');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe('Hello');
  });

  it('should handle deletions', async () => {
    // Seed data
    await db.messages.add({
      messageId: 'del-1',
      conversationId: 'c1',
      content: 'To be deleted',
      status: 'seen',
      timestamp: Date.now(),
    });

    // Mock deletion response
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        timestamp: new Date().toISOString(),
        deletedMessageIds: ['del-1'],
      }),
    });

    await pullDelta(db);

    const msgs = await db.messages.toArray();
    expect(msgs).toHaveLength(0);
  });
});
