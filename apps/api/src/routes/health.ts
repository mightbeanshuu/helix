import { z } from 'zod';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const startedAt = Date.now();

// eslint-disable-next-line @typescript-eslint/require-await
export const registerHealth: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/v1/health',
    {
      schema: {
        response: {
          200: z.object({
            ok: z.literal(true),
            version: z.string(),
            uptimeMs: z.number().int().nonnegative(),
            storage: z.string(),
          }),
        },
      },
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async () => ({
      ok: true as const,
      version: '0.1.0',
      uptimeMs: Date.now() - startedAt,
      storage: app.storage.kind,
    }),
  );
};
