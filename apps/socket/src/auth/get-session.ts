import { auth } from '@repo/auth';

async function getSession(cookie: string) {
  const headers = new Headers();
  headers.set('cookie', cookie);
  return auth.api.getSession({ headers });
}

export { getSession };
