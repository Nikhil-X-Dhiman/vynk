import { authClient } from './auth-client';

function getCurrentSession() {
  const authSession = authClient.useSession();
  return authSession;
}
export { getCurrentSession };
