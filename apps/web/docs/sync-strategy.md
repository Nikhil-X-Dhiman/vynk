# Offline Synchronization Strategy

This document outlines the "Flush then Pull" synchronization strategy used in the Vynk application to ensure data consistency between the local (offline-first) database and the server.

## Overview

The application uses a **local-first** approach:
1.  **Local Writes**: All user actions (sending messages, creating stories) are immediately applied to the local `Dexie` database and UI.
2.  **Queueing**: Operations are added to a persistent operation queue (`queue` table in Dexie).
3.  **Sync**: When online, the client performs a synchronization cycle:
    *   **Flush**: Pushes queued operations to the server in batches.
    *   **Pull**: Fetches the "delta" (state changes) from the server since the last sync.

## Sync Flow

### 1. Client-Side Queueing (Optimistic UI)

When a user performs an action (e.g., Send Message):
- The app generates a temporary or permanent **UUID** for the item. *Crucial*: Using UUIDs allows the client to define the ID, ensuring idempotency.
- The item is saved to the local store (e.g., `messages` table).
- An operation record is added to the `queue` table:
    ```javascript
    {
      action: "MESSAGE_SEND",
      payload: { id: "uuid-123", content: "Hello", ... },
      timestamp: Date.now()
    }
    ```
- The UI reflects the change immediately.

### 2. Flush (Push to Server)

The client sends pending queue items to `POST /api/sync`.
- **Batch Processing**: The server groups operations by type (Messages, Stories, Reactions) to minimize database round-trips.
- **Idempotency**: The server uses `ON CONFLICT DO NOTHING` (or `UPSERT`) based on the item's UUID.
    - If the server already has this Message ID (e.g., from a previous retried request), the duplicate is ignored.
- **Bulk Handling**:
    - **Inserts**: uses `INSERT INTO ... VALUES (...)`.
    - **Deletes**: uses `UPDATE ... SET is_deleted=true WHERE id IN (...)`.
- **Server Wins**: If an operation is invalid (e.g., reacting to a deleted message), it is either ignored or fails. The client largely trusts the server's final state during the subsequent "Pull" phase.

### 3. Pull (Delta Sync)

The client requests updates from `GET /api/sync?since=<TIMESTAMP>`.
- The server queries for:
    - New/Updated Messages (`updated_at > since`)
    - New/Updated Stories (`updated_at > since`)
    - Deleted IDs (`is_deleted = true` AND `updated_at > since`)
- The client applies these changes to the local Dexie DB:
    - **Upsert**: Insert or Update local records.
    - **Delete**: Remove records matching deleted IDs.
    - **Update Cursor**: Save the new `timestamp` as `lastSyncedAt`.

## Conflict Resolution

- **Creation Conflicts**: Handled via UUIDs. If Client A sends Message X, and Client A sends Message X again (retry), the server sees the same UUID and ignores the second insert.
- **Edit/Delete Conflicts**:
    - "Last Writer Wins" semantics on the field level usually, but currently simplified to "Server Wins".
    - If a user deletes a message locally, the `MESSAGE_DELETE` is queued. If the server already marked it deleted, the operation is redundant but safe.
    - If a user edits a message while another deletes it, the deletion (via `is_deleted` flag) typically takes precedence in UI visibility.
- **Reactions**: Unique constraints (e.g., User + Message) ensure a user can only have one reaction per message. Upsert logic (`onConflict`) is used to update the emoji if changed.

## Server-Side Implementation Details

The `POST /api/sync` endpoint is optimized for high-throughput:
- **No loops for DB calls**: Operations are grouped and executed in bulk.
- **Transactional Safety (Implicit)**: While not wrapped in a single monolithic transaction (to allow partial success of batches), operations within a group are atomic where possible.
- **Security**: All operations enforce `sender_id` or `user_id` checks to ensure users can only modify their own data.

## Client Requirements

To ensure zero-data-loss and correct syncing:
1.  **Generate IDs Locally**: Clients must generate `uuid` v4 for Messages and Stories.
2.  **Preserve Timestamps**: Send `created_at` / `timestamp` to preserve message ordering context, though the server may override correct `created_at` if significantly drifted.
3.  **Handle Failures**: If the `flush` fails (network error), the queue **must not** be cleared. It should retry later.
