import { db } from '@/lib/db';

/**
 * SyncService - Handles initial and delta synchronization with the server
 */
export class SyncService {
  private static isSyncing = false;

  /**
   * Perform initial sync on login
   * Called when user logs in for the first time or after logout
   */
  static async performInitialSync(): Promise<{ success: boolean; error?: unknown }> {
    if (this.isSyncing) {
      console.log('[SyncService] Already syncing, skipping...');
      return { success: false, error: 'Already syncing' };
    }

    this.isSyncing = true;
    console.log('[SyncService] Starting initial sync...');

    try {
      const result = await db.performInitialSync();
      console.log('[SyncService] Initial sync completed:', result.success);
      return result;
    } catch (error) {
      console.error('[SyncService] Initial sync failed:', error);
      return { success: false, error };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Perform delta sync to get updates since last sync
   */
  static async performDeltaSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('[SyncService] Already syncing, skipping...');
      return;
    }

    this.isSyncing = true;
    console.log('[SyncService] Starting delta sync...');

    try {
      await db.pullDelta();
      console.log('[SyncService] Delta sync completed');
    } catch (error) {
      console.error('[SyncService] Delta sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Check if initial sync has been completed
   */
  static async isFirstSync(): Promise<boolean> {
    const completed = await db.isInitialSyncCompleted();
    return !completed;
  }

  /**
   * Trigger sync based on current state
   * - First login: perform initial sync
   * - Returning user: perform delta sync
   */
  static async triggerSync(): Promise<void> {
    const isFirst = await this.isFirstSync();

    if (isFirst) {
      await this.performInitialSync();
    } else {
      await this.performDeltaSync();
    }
  }

  /**
   * Clear all local data (for logout)
   */
  static async clearLocalData(): Promise<void> {
    console.log('[SyncService] Clearing local data...');
    await db.clearAllData();
    console.log('[SyncService] Local data cleared');
  }

  /**
   * Force full resync (clear and re-fetch)
   */
  static async forceResync(): Promise<{ success: boolean; error?: unknown }> {
    await this.clearLocalData();
    return await this.performInitialSync();
  }
}
