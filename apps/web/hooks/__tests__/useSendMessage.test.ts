import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSendMessage } from '../useSendMessage';
import * as dbLib from '@/lib/db';
import * as authStore from '@/store/auth';
import * as socketClient from '@/lib/services/socket/client';

// Mocks
vi.mock('@/lib/db', () => ({
  db: {
    messages: {
      add: vi.fn(),
      update: vi.fn(),
      where: () => ({
        equals: () => ({
          first: vi.fn(),
        }),
      }),
    },
    conversations: {
      update: vi.fn(),
      where: () => ({ equals: () => ({ first: vi.fn() }) }),
    },
    participants: {
      where: () => ({ equals: () => ({ toArray: vi.fn().mockResolvedValue([]) }) }),
    },
  },
}));

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/lib/services/socket/client', () => ({
  getSocket: vi.fn(),
}));

describe('useSendMessage', () => {
  const mockEmit = vi.fn();
  const mockUser = { id: 'user1' };

  beforeEach(() => {
    vi.clearAllMocks();
    (authStore.useAuthStore as any).mockReturnValue({ user: mockUser });
    (socketClient.getSocket as any).mockReturnValue({ emit: mockEmit });
  });

  it('should send message when online', async () => {
    const { result } = renderHook(() => useSendMessage('chat1', true));

    await act(async () => {
      await result.current('Hello World');
    });

    // Check DB add
    expect(dbLib.db.messages.add).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'chat1',
        content: 'Hello World',
        status: 'pending',
      }),
    );

    // Check Socket emit
    expect(mockEmit).toHaveBeenCalledWith(
      'MESSAGE_SEND',
      expect.objectContaining({
        conversationId: 'chat1',
        content: 'Hello World',
      }),
      expect.any(Function),
    );
  });

  it('should NOT send message when offline', async () => {
    const { result } = renderHook(() => useSendMessage('chat1', false));

    await act(async () => {
      await result.current('Hello World');
    });

    expect(dbLib.db.messages.add).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('should not send if user is not logged in', async () => {
    (authStore.useAuthStore as any).mockReturnValue({ user: null });
    const { result } = renderHook(() => useSendMessage('chat1', true));

    await act(async () => {
      await result.current('Hello World');
    });

    expect(dbLib.db.messages.add).not.toHaveBeenCalled();
  });
});
