/**
 * @fileoverview Home Root Page
 *
 * Redirects to /chats as the default authenticated view.
 *
 * @module app/(home)/page
 */

import { permanentRedirect } from 'next/navigation';

export default function HomePage(): never {
  permanentRedirect('/chats')
}
