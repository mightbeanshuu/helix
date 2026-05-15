import pino from 'pino';

import type { Env } from './env.js';

export function createLogger(env: Env) {
  return pino({
    level: env.LOG_LEVEL,
    base: { service: 'helix-api', env: env.NODE_ENV },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers["x-api-key"]',
        '*.token',
        '*.apiKey',
        '*.password',
      ],
      remove: true,
    },
    ...(env.NODE_ENV !== 'production' && {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname' },
      },
    }),
  });
}
