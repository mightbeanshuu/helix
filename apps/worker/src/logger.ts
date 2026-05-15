import pino, { type Logger as PinoLogger } from 'pino';

import type { Env } from './env.js';

export type Logger = PinoLogger;

export function createLogger(env: Env): Logger {
  return pino({
    level: env.LOG_LEVEL,
    base: { service: 'helix-worker', env: env.NODE_ENV },
    ...(env.NODE_ENV !== 'production' && {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname' },
      },
    }),
  });
}
