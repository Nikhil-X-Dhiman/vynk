/**
 * @fileoverview Sync API Route Handlers
 *
 * Provides two endpoints for offline-first data synchronization:
 *
 * - **GET /api/sync?since=<ISO timestamp>**
 *   Returns all entities (messages, stories, users, conversations) that
 *   changed since the provided timestamp.
 *
 * - **POST /api/sync** (body: QueueItem[])
 *   Processes a batch of queued offline actions and returns individual
 *   results for each item.
 *
 * Both endpoints require an authenticated session.
 *
 * @module app/api/sync/route
 */

import { NextResponse } from 'next/server';
import { checkServerAuth } from '@/lib/auth/check-server-auth';
import { getSyncDelta, processSyncBatch, type QueueItem } from '@repo/db'


// ==========================================
// Types
// ==========================================

/** Standard error response shape for this route. */
interface ErrorResponse {
  success: false;
  error: string;
}

// ==========================================
// Helpers
// ==========================================

/**
 * Creates a consistent JSON error response.
 */
function errorResponse(
  error: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Parses the `since` query parameter into a `Date`.
 * Falls back to epoch (1970-01-01) when absent or invalid.
 */
function parseSinceParam(url: string): Date {
  const { searchParams } = new URL(url);
  const raw = searchParams.get('since');

  if (!raw) return new Date(0);

  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

// ==========================================
// GET /api/sync
// ==========================================

/**
 * Fetches the delta (changes) since the provided timestamp.
 *
 * @query since - ISO 8601 timestamp of last successful sync (defaults to epoch)
 * @returns Delta response with changed/deleted entities and a server timestamp
 *
 * @example
 * ```
 * GET /api/sync?since=2025-06-01T00:00:00.000Z
 * ```
 */
export async function GET(req: Request) {
  try {
    const { isAuth, session } = await checkServerAuth();

    if (!isAuth) {
      return errorResponse('Unauthorized', 401);
    }

    const since = parseSinceParam(req.url);
    const delta = await getSyncDelta(session.user.id, since);

    return NextResponse.json(delta);
  } catch (error) {
    console.error('[Sync] GET failed:', error);
    return errorResponse('Internal Server Error', 500);
  }
}

// ==========================================
// POST /api/sync
// ==========================================

/**
 * Processes a batch of queued offline actions.
 *
 * Expects a JSON array of `QueueItem` objects in the request body.
 * Returns individual success/failure results for each item so the
 * client can remove processed items from its queue.
 *
 * @body QueueItem[] - Array of queued offline actions
 * @returns `{ success: true, results: BatchProcessingResult[] }`
 *
 * @example
 * ```json
 * POST /api/sync
 * [
 *   { "id": 1, "action": "MESSAGE_SEND", "payload": { ... }, "timestamp": 1717200000000 },
 *   { "id": 2, "action": "DELIVERY_UPDATE", "payload": { ... }, "timestamp": 1717200001000 }
 * ]
 * ```
 */
export async function POST(req: Request) {
  try {
    const { isAuth, session } = await checkServerAuth();

    if (!isAuth) {
      return errorResponse('Unauthorized', 401);
    }

    let items: QueueItem[];

    try {
      items = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    if (!Array.isArray(items)) {
      return errorResponse('Request body must be an array of queue items', 400);
    }

    if (items.length === 0) {
      return NextResponse.json({ success: true, results: [] });
    }

    const results = await processSyncBatch(session.user.id, items);

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[Sync] POST failed:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
