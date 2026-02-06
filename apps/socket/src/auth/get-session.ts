import { auth } from '@repo/auth';

/** Result type for session retrieval */
type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Retrieves the user session from authentication cookies.
 *
 * @param cookie - The cookie string from the socket handshake headers
 * @returns The session object if valid, null otherwise
 * @throws Will throw if the auth service is unavailable
 */
async function getSession(cookie: string): Promise<SessionResult> {
  if (!cookie) {
    return null;
  }

  const headers = new Headers();
  headers.set('cookie', cookie);

  return auth.api.getSession({ headers });
}

export { getSession };
export type { SessionResult };
