/**
 * @fileoverview Initial Sync API Route
 *
 * **GET /api/initial-sync**
 *
 * Returns a full dataset for the user to initialize their local offline database:
 * - Conversations metadata
 * - All messages for these conversations
 * - All participants for these conversations
 * - All registered users (for profile resolution)
 *
 * Logic for cross-referencing and rendering is handled on the client.
 */

import { NextResponse } from 'next/server'
import {
  getUserConversations,
  getUserMessages,
  getUserParticipants,
  getAllUsers,
  db,
  sql,
} from '@repo/db'
import { checkServerAuth } from '@/lib/auth/check-server-auth'

/** Error response. */
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
  timestamp: string
}

/** Consistant JSON error response helper. */
function errorResponse(
  error: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ success: false, error }, { status })
}

export async function GET(): Promise<
  NextResponse<InitialSyncResponse | ErrorResponse>
> {
  try {
    const { isAuth, session } = await checkServerAuth()

    if (!isAuth) {
      return errorResponse('Unauthorized', 401)
    }

    const userId = session.user.id
    console.log('Initial sync for user:', userId)

    // DEBUG: Check total counts in DB
    const [totalConvs, totalParticipants, totalMessages] = await Promise.all([
      db
        .selectFrom('conversation')
        .select(sql<number>`count(*)`.as('count'))
        .executeTakeFirst(),
      db
        .selectFrom('participant')
        .select(sql<number>`count(*)`.as('count'))
        .executeTakeFirst(),
      db
        .selectFrom('message')
        .select(sql<number>`count(*)`.as('count'))
        .executeTakeFirst(),
    ])
    console.log('[InitialSync DEBUG] Total in DB:', {
      conversations: totalConvs?.count,
      participants: totalParticipants?.count,
      messages: totalMessages?.count,
    })
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

    // Error handling
    if (!conversationsResult.success) {
      return errorResponse('Failed to fetch conversations', 500)
    }
    if (!messagesResult.success) {
      return errorResponse('Failed to fetch messages', 500)
    }
    if (!participantsResult.success) {
      return errorResponse('Failed to fetch participants', 500)
    }
    if (!usersResult.success) {
      return errorResponse('Failed to fetch users', 500)
    }

    console.log('Initial sync data', {
      conversations: conversationsResult.data,
      messages: messagesResult.data,
      participants: participantsResult.data,
      users: usersResult.data,
    })
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
