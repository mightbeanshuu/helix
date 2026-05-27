import type {
  ClassRecord,
  FileId,
  FileRecord,
  FunctionRecord,
  ImportRecord,
  ModuleRecord,
  ScanId,
  ScanStage,
  ScanStatus,
} from '@helix/shared';

export interface StorageAdapter {
  readonly kind: string;
  upsertFiles(scanId: ScanId, files: FileRecord[]): Promise<void>;
  upsertClasses(scanId: ScanId, classes: ClassRecord[]): Promise<void>;
  upsertFunctions(scanId: ScanId, functions: FunctionRecord[]): Promise<void>;
  upsertImports(scanId: ScanId, imports: ImportRecord[]): Promise<void>;
  upsertModules(scanId: ScanId, modules: ModuleRecord[]): Promise<void>;

  createScan(status: ScanStatus): Promise<void>;
  listScans(): Promise<ScanStatus[]>;
  getScan(id: ScanId): Promise<ScanStatus | null>;
  getFileTree(id: ScanId): Promise<Record<string, unknown>>;
  getGraph(id: ScanId, view: string): Promise<Record<string, unknown>>;
  getFileDetail(id: ScanId, fileId: FileId): Promise<Record<string, unknown> | null>;
  deleteScan(id: ScanId): Promise<void>;
  updateScan(scanId: ScanId, updates: Partial<ScanStatus>): Promise<void>;
  setStage(scanId: ScanId, stage: ScanStage, percent: number, msg?: string): Promise<void>;

  close(): Promise<void>;
}

export class MemoryStorageAdapter implements StorageAdapter {
  readonly kind = 'memory';

  async upsertFiles(_scanId: ScanId, _files: FileRecord[]): Promise<void> {
    await Promise.resolve();
  }
  async upsertClasses(_scanId: ScanId, _classes: ClassRecord[]): Promise<void> {
    await Promise.resolve();
  }
  async upsertFunctions(_scanId: ScanId, _functions: FunctionRecord[]): Promise<void> {
    await Promise.resolve();
  }
  async upsertImports(_scanId: ScanId, _imports: ImportRecord[]): Promise<void> {
    await Promise.resolve();
  }
  async upsertModules(_scanId: ScanId, _modules: ModuleRecord[]): Promise<void> {
    await Promise.resolve();
  }

  async createScan(_status: ScanStatus): Promise<void> {
    await Promise.resolve();
  }
  async listScans(): Promise<ScanStatus[]> {
    await Promise.resolve();
    return [];
  }
  async getScan(_id: ScanId): Promise<ScanStatus | null> {
    await Promise.resolve();
    return null;
  }
  async getFileTree(_id: ScanId): Promise<Record<string, unknown>> {
    await Promise.resolve();
    return {};
  }
  async getGraph(_id: ScanId, _view: string): Promise<Record<string, unknown>> {
    await Promise.resolve();
    return {};
  }
  async getFileDetail(_id: ScanId, _fileId: FileId): Promise<Record<string, unknown> | null> {
    await Promise.resolve();
    return null;
  }
  async deleteScan(_id: ScanId): Promise<void> {
    await Promise.resolve();
  }
  async updateScan(_scanId: ScanId, _updates: Partial<ScanStatus>): Promise<void> {
    await Promise.resolve();
  }
  async setStage(
    _scanId: ScanId,
    _stage: ScanStage,
    _percent: number,
    _msg?: string,
  ): Promise<void> {
    await Promise.resolve();
  }

  async close(): Promise<void> {
    await Promise.resolve();
  }
}

export class Neo4jStorageAdapter implements StorageAdapter {
  readonly kind = 'neo4j';

  async upsertFiles(_scanId: ScanId, _files: FileRecord[]): Promise<void> {
    await Promise.resolve();
  }
  async upsertClasses(_scanId: ScanId, _classes: ClassRecord[]): Promise<void> {
    await Promise.resolve();
  }
  async upsertFunctions(_scanId: ScanId, _functions: FunctionRecord[]): Promise<void> {
    await Promise.resolve();
  }
  async upsertImports(_scanId: ScanId, _imports: ImportRecord[]): Promise<void> {
    await Promise.resolve();
  }
  async upsertModules(_scanId: ScanId, _modules: ModuleRecord[]): Promise<void> {
    await Promise.resolve();
  }

  async createScan(_status: ScanStatus): Promise<void> {
    await Promise.resolve();
  }
  async listScans(): Promise<ScanStatus[]> {
    await Promise.resolve();
    return [];
  }
  async getScan(_id: ScanId): Promise<ScanStatus | null> {
    await Promise.resolve();
    return null;
  }
  async getFileTree(_id: ScanId): Promise<Record<string, unknown>> {
    await Promise.resolve();
    return {};
  }
  async getGraph(_id: ScanId, _view: string): Promise<Record<string, unknown>> {
    await Promise.resolve();
    return {};
  }
  async getFileDetail(_id: ScanId, _fileId: FileId): Promise<Record<string, unknown> | null> {
    await Promise.resolve();
    return null;
  }
  async deleteScan(_id: ScanId): Promise<void> {
    await Promise.resolve();
  }
  async updateScan(_scanId: ScanId, _updates: Partial<ScanStatus>): Promise<void> {
    await Promise.resolve();
  }
  async setStage(
    _scanId: ScanId,
    _stage: ScanStage,
    _percent: number,
    _msg?: string,
  ): Promise<void> {
    await Promise.resolve();
  }

  async close(): Promise<void> {
    await Promise.resolve();
  }
}

export async function createStorage(env: Record<string, unknown>): Promise<StorageAdapter> {
  await Promise.resolve();
  if (env.STORAGE_DRIVER === 'neo4j') {
    return new Neo4jStorageAdapter();
  }
  return new MemoryStorageAdapter();
}
