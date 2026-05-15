import type { ScanId, ScanProgress } from '@helix/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

const Params = z.object({ id: z.string() });

/**
 * Server-Sent Events stream of scan progress. Clients connect with EventSource
 * and receive a fresh JSON object per stage transition. We send a `:keepalive`
 * comment every 25s to keep proxies from killing the connection.
 */
export const registerEvents: FastifyPluginAsyncZod = async (app) => {
  app.get('/v1/scans/:id/events', { schema: { params: Params } }, async (req, reply) => {
    const scanId = req.params.id;
    void reply.raw.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });

    const write = (data: ScanProgress): void => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const current = await app.storage.getScan(scanId as ScanId);
    if (current) {
      write({
        scanId,
        stage: current.stage,
        percent: current.percent,
        message: `current stage: ${current.stage}`,
        at: new Date().toISOString(),
      });
    }

    const unsub = app.events.subscribe(scanId, write);
    const ping = setInterval(() => reply.raw.write(`:ka\n\n`), 25_000);

    req.raw.on('close', () => {
      clearInterval(ping);
      unsub();
      reply.raw.end();
    });
  });
};
