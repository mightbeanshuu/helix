import type {
  CreateScanRequest,
  CreateScanResponse,
  CytoscapeGraph,
  FileDetail,
  FileTreeNodeShape,
  ScanStatus,
} from '@helix/shared';

const base = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const problem: { title?: string; detail?: string; status?: number } = await res
      .json()
      .catch(() => ({}));
    throw new Error(`${res.status}: ${problem.title ?? problem.detail ?? res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  createScan: (body: CreateScanRequest) =>
    request<CreateScanResponse>('/v1/scans', { method: 'POST', body: JSON.stringify(body) }),
  getScan: (id: string) => request<ScanStatus>(`/v1/scans/${id}`),
  listScans: () => request<{ scans: ScanStatus[] }>('/v1/scans'),
  getTree: (id: string) => request<FileTreeNodeShape>(`/v1/scans/${id}/tree`),
  getGraph: (id: string, view: 'modules' | 'files' | 'functions' | 'classes' = 'files') =>
    request<CytoscapeGraph>(`/v1/scans/${id}/graph?view=${view}`),
  getFile: (id: string, fileId: string) =>
    request<FileDetail>(`/v1/scans/${id}/file/${fileId}`),
  deleteScan: (id: string) => request<void>(`/v1/scans/${id}`, { method: 'DELETE' }),
  events: (id: string): EventSource => new EventSource(`${base}/v1/scans/${id}/events`),
};
