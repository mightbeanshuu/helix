import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { HelixError } from '@helix/shared';
import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify';
import { type ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { createLogger } from './logger.js';
import { registerEvents } from './routes/events.js';
import { registerHealth } from './routes/health.js';
import { registerScans } from './routes/scans.js';
import { eventBus } from './services/events.js';
import { createQueue } from './services/queue.js';

import type { Env } from './env.js';
import type { StorageAdapter } from '@helix/storage';

export interface BuildServerArgs {
  env: Env;
  storage: StorageAdapter;
}

export async function buildServer({ env, storage }: BuildServerArgs): Promise<FastifyInstance> {
  const logger = createLogger(env);

  const app = Fastify({
    // Pino's Logger and Fastify's FastifyBaseLogger are structurally the
    // same; the only diff is the optional `msgPrefix` slot. Casting is the
    // pragmatic path until upstream tightens the constraint.
    loggerInstance: logger as unknown as FastifyBaseLogger,
    bodyLimit: env.API_BODY_LIMIT_MB * 1024 * 1024,
    disableRequestLogging: env.NODE_ENV === 'production',
    genReqId: () => `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(sensible);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.API_CORS_ORIGIN === '*' ? true : env.API_CORS_ORIGIN.split(','),
    credentials: true,
  });
  await app.register(rateLimit, {
    max: env.API_RATE_LIMIT_PER_MIN,
    timeWindow: '1 minute',
    skipOnError: false,
  });

  const queue = createQueue(env);

  app.decorate('storage', storage);
  app.decorate('queue', queue);
  app.decorate('events', eventBus);

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof HelixError) {
      void reply.status(err.status).type('application/problem+json').send(err.toProblem());
      return;
    }
    req.log.error({ err }, 'unhandled error');
    void reply
      .status(500)
      .type('application/problem+json')
      .send({ type: 'helix:internal', title: 'Internal Server Error', status: 500 });
  });

  await app.register(registerHealth);
  await app.register(registerScans);
  await app.register(registerEvents);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    storage: StorageAdapter;
    queue: ReturnType<typeof createQueue>;
    events: typeof eventBus;
  }
}
