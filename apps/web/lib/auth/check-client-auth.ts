import { authClient } from './auth-client';

const getCurrentSession = async () => {
  const { data } = await authClient.getSession();
  return data;
};

export const checkClientAuth = async () => {
  const session = await getCurrentSession();
  if (!session) {
    return { isAuth: false, session: null };
  }
  return { isAuth: true, session };
};
