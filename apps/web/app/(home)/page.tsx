/**
 * @fileoverview Home Root Page – Redirect to Chats
 *
 * The `/` (home) route is not a real page; it simply redirects users
 * to `/chats`, which is the primary authenticated landing view.
 *
 * Uses `permanentRedirect` (HTTP 308) because the home root will
 * **always** forward to `/chats`. This lets browsers and CDNs cache the
 * redirect, avoiding an unnecessary round-trip on repeat visits.
 *
 * @module app/(home)/page
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/functions/permanentRedirect}
 */

import { permanentRedirect } from 'next/navigation';

// ==========================================
// Route Constants
// ==========================================

/** Default authenticated landing route. */
const DEFAULT_ROUTE = '/chats' as const;

// ==========================================
// Page
// ==========================================

/**
 * Root home page — immediately redirects to the default route.
 *
 * This is a server component; the redirect happens before any HTML
 * is sent to the client.
 */
export default function HomePage(): never {
  permanentRedirect(DEFAULT_ROUTE);
}
