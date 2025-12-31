import { toNextJsHandler } from 'better-auth/next-js';
import { createAuthClient } from 'better-auth/react';
import { phoneNumberClient } from 'better-auth/client/plugins';
import { auth } from '../better-auth/auth';

export { auth, toNextJsHandler, createAuthClient, phoneNumberClient };
