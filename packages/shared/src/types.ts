import type { SupportedLanguage } from './constants.js';
import type { AuthorId, ClassId, CommitId, FileId, FunctionId, ModuleId, ScanId } from './ids.js';

export interface FileRecord {
  id: FileId;
  scanId: ScanId;
  path: string;
  language: SupportedLanguage | 'unknown';
  loc: number;
  complexity: number;
  churn: number;
  contentHash: string;
  lastModified?: string;
  summary?: string;
}

export interface ImportRecord {
  fromFileId: FileId;
  toFileId?: FileId;
  rawSpecifier: string;
  resolved: boolean;
}

export interface ClassRecord {
  id: ClassId;
  fileId: FileId;
  name: string;
  fqn: string;
  lineStart: number;
  lineEnd: number;
  extends?: string;
  implements?: string[];
}

export interface FunctionRecord {
  id: FunctionId;
  fileId: FileId;
  classId?: ClassId;
  name: string;
  fqn: string;
  lineStart: number;
  lineEnd: number;
  complexity: number;
  params: string[];
  returns?: string;
  isAsync?: boolean;
  isExported?: boolean;
}

export interface CallRecord {
  fromFunctionId: FunctionId;
  toFunctionFqn: string;
  toFunctionId?: FunctionId;
}

export interface AuthorRecord {
  id: AuthorId;
  name: string;
  email?: string;
  commits: number;
}

export interface CommitRecord {
  id: CommitId;
  scanId: ScanId;
  sha: string;
  message: string;
  authoredAt: string;
  authorId: AuthorId;
  files: string[];
}

export interface ModuleRecord {
  id: ModuleId;
  scanId: ScanId;
  path: string;
  name: string;
  language: SupportedLanguage | 'mixed';
  fileIds: FileId[];
}

export interface CoChangeEdge {
  fileA: FileId;
  fileB: FileId;
  weight: number;
}
