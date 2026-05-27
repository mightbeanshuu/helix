import {
  CreateScanRequest,
  CreateScanResponse,
  type FileId,
  NotFoundError,
  type ScanId,
  ScanStatus,
  newScanId,
} from '@helix/shared';
import { z } from 'zod';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const ScanIdParams = z.object({ id: z.string() });
const FileIdParams = z.object({ id: z.string(), fileId: z.string() });
const GraphQuery = z.object({
  view: z.enum(['modules', 'files', 'functions', 'classes', 'co-change']).default('files'),
});

// eslint-disable-next-line @typescript-eslint/require-await
export const registerScans: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/v1/scans',
    {
      schema: {
        body: CreateScanRequest,
        response: { 202: CreateScanResponse },
      },
    },
    async (req, reply) => {
      const scanId = newScanId();
      const now = new Date().toISOString();
      const status: ScanStatus = {
        scanId,
        url: req.body.url,
        stage: 'queued',
        percent: 0,
        startedAt: now,
      };
      await app.storage.createScan(status);
      await app.queue.add('scan', { scanId, request: req.body }, { jobId: scanId });
      void reply.code(202);
      return { scanId, url: req.body.url, status: 'queued' as const };
    },
  );

  app.get(
    '/v1/scans',
    {
      schema: {
        response: { 200: z.object({ scans: z.array(ScanStatus) }) },
      },
    },
    async () => ({ scans: await app.storage.listScans() }),
  );

  app.get(
    '/v1/scans/:id',
    {
      schema: { params: ScanIdParams, response: { 200: ScanStatus } },
    },
    async (req) => {
      const scan = await app.storage.getScan(req.params.id as ScanId);
      if (!scan) throw new NotFoundError('Scan', req.params.id);
      return scan;
    },
  );

  app.get(
    '/v1/scans/:id/tree',
    { schema: { params: ScanIdParams } },
    async (req) => app.storage.getFileTree(req.params.id as ScanId),
  );

  app.get(
    '/v1/scans/:id/graph',
    { schema: { params: ScanIdParams, querystring: GraphQuery } },
    async (req) => app.storage.getGraph(req.params.id as ScanId, req.query.view),
  );

  app.get(
    '/v1/scans/:id/file/:fileId',
    { schema: { params: FileIdParams } },
    async (req) => {
      const detail = await app.storage.getFileDetail(
        req.params.id as ScanId,
        req.params.fileId as FileId,
      );
      if (!detail) throw new NotFoundError('File', req.params.fileId);
      return detail;
    },
  );

  app.delete(
    '/v1/scans/:id',
    { schema: { params: ScanIdParams } },
    async (req, reply) => {
      await app.storage.deleteScan(req.params.id as ScanId);
      void reply.code(204).send();
    },
  );
};
