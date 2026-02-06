/**
 * Socket Server Configuration
 *
 * Centralized configuration using environment variables with proper defaults.
 */

export const config = {
  /** Server port */
  port: parseInt(process.env.SOCKET_PORT || '3001', 10),

  /** CORS allowed origin */
  corsOrigin: process.env.NEXT_URL || 'http://localhost:3000',

  /** Redis connection configuration */
  redis: {
    username: process.env.REDIS_USERNAME || '',
    password: process.env.REDIS_PASSWORD || '',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    get url() {
      const auth =
        this.username || this.password
          ? `${this.username}:${this.password}@`
          : '';
      return `redis://${auth}${this.host}:${this.port}`;
    },
  },

  /** Environment flags */
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
} as const;

export type Config = typeof config;
