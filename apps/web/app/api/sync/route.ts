/**
 * @fileoverview Sync API Route Handlers
 *
 * Provides endpoint for offline-first data synchronization:
 *
 * - **GET /api/sync?since=<ISO timestamp>**
 *   Returns all entities (messages, stories, users, conversations) that
 *   changed since the provided timestamp.
 *
 * @module app/api/sync/route
 */

import { NextResponse } from 'next/server';
import { checkServerAuth } from '@/lib/auth/check-server-auth';
import { getSyncDelta } from '@repo/db'

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
