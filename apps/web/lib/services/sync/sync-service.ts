/**
 * @fileoverview Sync Service
 *
 * Handles initial and delta synchronization between the local IndexedDB
 * and the server. Coordinates sync operations to prevent concurrent syncs.
 *
 * @module lib/services/sync/sync-service
 *
 * @example
 * ```ts
 * import { SyncService } from '@/lib/services/sync';
 *
 * // On app load
 * await SyncService.triggerSync();
 *
 * // After network reconnection
 * await SyncService.performDeltaSync();
 *
 * // On logout
 * await SyncService.clearLocalData();
 * ```
 */

import { db } from '@/lib/db';

// ==========================================
// Types
// ==========================================

/**
 * Result of a sync operation.
 */
export interface SyncResult {
  /** Whether the sync completed successfully */
  success: boolean;
  /** Error details if sync failed */
  error?: unknown;
  /** Number of items synced (if available) */
  itemCount?: number;
}

// ==========================================
// Sync Service Class
// ==========================================

/**
 * Static service for managing data synchronization.
 *
 * Features:
 * - Prevents concurrent sync operations
 * - Handles initial (full) and delta (incremental) syncs
 * - Provides clear/resync capabilities for logout/errors
 */
export class SyncService {
  /** Flag to prevent concurrent sync operations */
  private static isSyncing = false;

  /** Last successful sync timestamp */
  private static lastSyncAt: number | null = null;

  // ==========================================
  // Sync Operations
  // ==========================================

  /**
   * Performs initial sync on first login.
   * Fetches all user data from the server.
   *
   * @returns Result indicating success/failure
   */
  static async performInitialSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncService] Already syncing, skipping initial sync');
      return { success: false, error: 'Sync already in progress' };
    }

    this.isSyncing = true;
    console.log('[SyncService] Starting initial sync...');

    try {
      const result = await db.performInitialSync();
      this.lastSyncAt = Date.now();
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
   * Performs delta sync to get updates since last sync.
   * Only fetches changed data since the last sync timestamp.
   *
   * @returns Result indicating success/failure
   */
  static async performDeltaSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncService] Already syncing, skipping delta sync');
      return { success: false, error: 'Sync already in progress' };
    }

    this.isSyncing = true;
    console.log('[SyncService] Starting delta sync...');

    try {
      await db.pullDelta();
      this.lastSyncAt = Date.now();
      console.log('[SyncService] Delta sync completed');
      return { success: true };
    } catch (error) {
      console.error('[SyncService] Delta sync failed:', error);
      return { success: false, error };
    } finally {
      this.isSyncing = false;
    }
  }

  // ==========================================
  // Sync Triggers
  // ==========================================

  /**
   * Triggers the appropriate sync based on current state.
   * - First time users: performs initial (full) sync
   * - Returning users: performs delta (incremental) sync
   *
   * @returns Result indicating success/failure
   */
  static async triggerSync(): Promise<SyncResult> {
    const isFirst = await this.isFirstSync();

    if (isFirst) {
      return await this.performInitialSync();
    } else {
      return await this.performDeltaSync();
    }
  }

  /**
   * Checks if this is the first sync (no prior sync completed).
   *
   * @returns True if initial sync hasn't been completed
   */
  static async isFirstSync(): Promise<boolean> {
    const completed = await db.isInitialSyncCompleted();
    return !completed;
  }

  // ==========================================
  // Data Management
  // ==========================================

  /**
   * Clears all local data.
   * Call this on logout or when user requests data deletion.
   */
  static async clearLocalData(): Promise<void> {
    console.log('[SyncService] Clearing local data...');
    await db.clearAllData();
    this.lastSyncAt = null;
    console.log('[SyncService] Local data cleared');
  }

  /**
   * Forces a full resync by clearing all data and performing initial sync.
   * Use this to recover from sync errors or data corruption.
   *
   * @returns Result of the initial sync
   */
  static async forceResync(): Promise<SyncResult> {
    console.log('[SyncService] Force resync requested...');
    await this.clearLocalData();
    return await this.performInitialSync();
  }

  // ==========================================
  // Status
  // ==========================================

  /**
   * Checks if a sync operation is currently in progress.
   *
   * @returns True if syncing
   */
  static isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Gets the timestamp of the last successful sync.
   *
   * @returns Timestamp in milliseconds or null if never synced
   */
  static getLastSyncTime(): number | null {
    return this.lastSyncAt;
  }
}
