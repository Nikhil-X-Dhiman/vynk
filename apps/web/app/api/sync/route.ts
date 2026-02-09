import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';
import { getSyncDelta, processSyncBatch, QueueItem } from '@/lib/db/sync';

/**
 * GET Handler for Sync
 * Fetches the delta (changes) since the provided timestamp.
 */
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sinceParam = searchParams.get('since');
    const since = sinceParam ? new Date(sinceParam) : new Date(0);

    const delta = await getSyncDelta(session.user.id, since);

    return NextResponse.json(delta);
  } catch (error) {
    console.error('Sync GET Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

/**
 * POST Handler for Sync
 * Processes a batch of offline actions (queue items).
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const items: QueueItem[] = await req.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Payload' },
        { status: 400 },
      );
    }

    const results = await processSyncBatch(session.user.id, items);

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Sync POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
