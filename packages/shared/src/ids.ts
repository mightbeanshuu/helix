import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const id = customAlphabet(alphabet, 16);

export type ScanId = string & { readonly __brand: 'ScanId' };
export type FileId = string & { readonly __brand: 'FileId' };
export type FunctionId = string & { readonly __brand: 'FunctionId' };
export type ClassId = string & { readonly __brand: 'ClassId' };
export type ModuleId = string & { readonly __brand: 'ModuleId' };
export type AuthorId = string & { readonly __brand: 'AuthorId' };
export type CommitId = string & { readonly __brand: 'CommitId' };

export const newScanId = (): ScanId => `scn_${id()}` as ScanId;
export const newFileId = (): FileId => `fil_${id()}` as FileId;
export const newFunctionId = (): FunctionId => `fnc_${id()}` as FunctionId;
export const newClassId = (): ClassId => `cls_${id()}` as ClassId;
export const newModuleId = (): ModuleId => `mod_${id()}` as ModuleId;
export const newAuthorId = (): AuthorId => `aut_${id()}` as AuthorId;
export const newCommitId = (): CommitId => `cmt_${id()}` as CommitId;

const isWithPrefix =
  <T extends string>(prefix: string) =>
  (value: unknown): value is T =>
    typeof value === 'string' && value.startsWith(prefix);

export const isScanId = isWithPrefix<ScanId>('scn_');
export const isFileId = isWithPrefix<FileId>('fil_');
export const isFunctionId = isWithPrefix<FunctionId>('fnc_');
