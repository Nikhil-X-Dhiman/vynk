import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncService } from '../sync-service';
import * as dbLib from '@/lib/db';

// Mock DB functions
vi.mock('@/lib/db', () => ({
  db: {
    clearAllData: vi.fn(),
  },
  performInitialSync: vi.fn(),
  pullDelta: vi.fn(),
  isInitialSyncCompleted: vi.fn(),
}));

describe('SyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset private static state? SyncService state is persistent in module scope.
    // We might need to access it or just rely on public API behavior.
    // Since we can't easily reset private statics, we ensure tests are robust.
  });

  it('should prevent concurrent syncs', async () => {
    (dbLib.performInitialSync as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 10)),
    );

    const p1 = SyncService.performInitialSync();
    const p2 = SyncService.performInitialSync();

    const results = await Promise.all([p1, p2]);

    // One should succeed, one should fail with "already in progress"
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    expect(successCount).toBe(1);
    expect(failCount).toBe(1);
  });

  it('should skip delta sync if initial sync not completed', async () => {
    (dbLib.isInitialSyncCompleted as any).mockResolvedValue(false);

    const result = await SyncService.performDeltaSync();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Initial sync not completed');
    expect(dbLib.pullDelta).not.toHaveBeenCalled();
  });

  it('should clear local data', async () => {
    await SyncService.clearLocalData();
    expect(dbLib.db.clearAllData).toHaveBeenCalled();
  });
});
