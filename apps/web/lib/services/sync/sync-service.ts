/**
 * @fileoverview Sync Service
 *
 * Handles initial and delta synchronization between the local IndexedDB
 * and the server.
 *
 * NOTE: Offline mutation queue support has been removed.
 * This service only fetches data from the server.
 *
 * @module lib/services/sync/sync-service
 */

import {
  db,
  performInitialSync,
  pullDelta,
  isInitialSyncCompleted,
} from '@/lib/db'

// ==========================================
// Types
// ==========================================

export interface SyncResult {
  success: boolean
  error?: unknown
}

// ==========================================
// Sync Service Class
// ==========================================

export class SyncService {
  private static isSyncing = false
  private static lastSyncAt: number | null = null

  static async performInitialSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncService] Already syncing, skipping initial sync')
      return { success: false, error: 'Sync already in progress' }
    }

    this.isSyncing = true
    console.log('[SyncService] Starting initial sync...')

    try {
      const result = await performInitialSync(db)
      this.lastSyncAt = Date.now()
      console.log('[SyncService] Initial sync completed:', result.success)
      return result
    } catch (error) {
      console.error('[SyncService] Initial sync failed:', error)
      return { success: false, error }
    } finally {
      this.isSyncing = false
    }
  }

  static async performDeltaSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncService] Already syncing, skipping delta sync')
      return { success: false, error: 'Sync already in progress' }
    }

    // Only delta sync if we have a baseline
    const initialSyncCompleted = await isInitialSyncCompleted(db)
    if (!initialSyncCompleted) {
      console.log(
        '[SyncService] Initial sync not completed, skipping delta sync',
      )
      return { success: false, error: 'Initial sync not completed' }
    }

    this.isSyncing = true
    console.log('[SyncService] Starting delta sync...')

    try {
      await pullDelta(db)
      this.lastSyncAt = Date.now()
      console.log('[SyncService] Delta sync completed')
      return { success: true }
    } catch (error) {
      console.error('[SyncService] Delta sync failed:', error)
      return { success: false, error }
    } finally {
      this.isSyncing = false
    }
  }

  static async triggerSync(): Promise<SyncResult> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, error: 'Offline' }
    }

    const isFirst = await this.isFirstSync()

    if (isFirst) {
      return await this.performInitialSync()
    } else {
      return await this.performDeltaSync()
    }
  }

  static async isFirstSync(): Promise<boolean> {
    const completed = await isInitialSyncCompleted(db)
    return !completed
  }

  static async clearLocalData(): Promise<void> {
    console.log('[SyncService] Clearing local data...')
    await db.clearAllData()
    this.lastSyncAt = null
    console.log('[SyncService] Local data cleared')
  }

  static async forceResync(): Promise<SyncResult> {
    console.log('[SyncService] Force resync requested...')
    await this.clearLocalData()
    return await this.performInitialSync()
  }

  static isSyncInProgress(): boolean {
    return this.isSyncing
  }

  static getLastSyncTime(): number | null {
    return this.lastSyncAt
  }
}
