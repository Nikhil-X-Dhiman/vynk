/**
 * @fileoverview Initial Sync API Route
 *
 * **GET /api/initial-sync**
 *
 * Returns a full dataset for the user to initialize their local offline database.
 * Data is fetched in parallel for performance.
 *
 * @module app/api/initial-sync/route
 */

import { NextResponse } from 'next/server'
import {
  getUserConversations,
  getUserMessages,
  getUserParticipants,
  getAllUsers,
} from '@repo/db'
import { checkServerAuth } from '@/lib/auth/check-server-auth'

// ==========================================
// Types
// ==========================================

/** Standard error response. */
interface ErrorResponse {
  success: false
  error: string
}

/** Successful initial sync response. */
interface InitialSyncResponse {
  success: true
  conversations: any[]
  messages: any[]
  participants: any[]
  users: any[]
  currentUserId: string
  timestamp: string
}

// ==========================================
// Helpers
// ==========================================

function errorResponse(
  error: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ success: false, error }, { status })
}

// ==========================================
// Endpoint
// ==========================================

export async function GET(): Promise<
  NextResponse<InitialSyncResponse | ErrorResponse>
> {
  try {
    const { isAuth, session } = await checkServerAuth()

    if (!isAuth) {
      return errorResponse('Unauthorized', 401)
    }

    const userId = session.user.id
    console.log('[InitialSync] Starting for user:', userId)

    // Fetch all required data in parallel
    const [
      conversationsResult,
      messagesResult,
      participantsResult,
      usersResult,
    ] = await Promise.all([
      getUserConversations(userId),
      getUserMessages(userId),
      getUserParticipants(userId),
      getAllUsers(),
    ])

    // Check for errors
    if (!conversationsResult.success)
      return errorResponse('Failed to fetch conversations', 500)
    if (!messagesResult.success)
      return errorResponse('Failed to fetch messages', 500)
    if (!participantsResult.success)
      return errorResponse('Failed to fetch participants', 500)
    if (!usersResult.success) return errorResponse('Failed to fetch users', 500)

    return NextResponse.json({
      success: true,
      conversations: conversationsResult.data,
      messages: messagesResult.data,
      participants: participantsResult.data,
      users: usersResult.data,
      currentUserId: userId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[InitialSync] Unexpected error:', error)
    return errorResponse('Internal Server Error', 500)
  }
}
