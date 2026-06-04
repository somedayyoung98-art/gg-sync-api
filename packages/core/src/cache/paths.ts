import path from 'node:path';

export const CACHE_DIR_NAME = '.api-sync-cache';

export function getCacheRoot(cwd: string): string {
  return path.join(cwd, CACHE_DIR_NAME);
}

export function getNamespaceCacheDir(cwd: string, namespace: string): string {
  return path.join(getCacheRoot(cwd), namespace);
}

export function getBaselineSchemaPath(cwd: string, namespace: string): string {
  return path.join(getNamespaceCacheDir(cwd, namespace), 'latest-schema.json');
}

export function getBaselineHashPath(cwd: string, namespace: string): string {
  return path.join(getNamespaceCacheDir(cwd, namespace), 'schema.hash');
}
