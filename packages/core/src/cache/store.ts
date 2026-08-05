import fs from 'node:fs/promises';
import {
  getBaselineHashPath,
  getBaselineSchemaPath,
  getNamespaceCacheDir,
} from './paths';
import type { Baseline, OpenAPIDocument } from '../pipeline/types';

export async function ensureCacheDir(cwd: string, namespace: string): Promise<void> {
  await fs.mkdir(getNamespaceCacheDir(cwd, namespace), { recursive: true });
}

export async function readBaseline(
  cwd: string,
  namespace: string,
): Promise<Baseline> {
  const schemaPath = getBaselineSchemaPath(cwd, namespace);
  try {
    const raw = await fs.readFile(schemaPath, 'utf-8');
    return {
      kind: 'present',
      document: JSON.parse(raw) as OpenAPIDocument,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { kind: 'missing' };
    }
    throw error;
  }
}

export async function writeBaseline(
  cwd: string,
  namespace: string,
  parsed: OpenAPIDocument,
  hash: string,
): Promise<void> {
  await ensureCacheDir(cwd, namespace);
  const schemaPath = getBaselineSchemaPath(cwd, namespace);
  const hashPath = getBaselineHashPath(cwd, namespace);
  await Promise.all([
    fs.writeFile(schemaPath, JSON.stringify(parsed, null, 2), 'utf-8'),
    fs.writeFile(hashPath, hash, 'utf-8'),
  ]);
}
