import fs from 'node:fs/promises';
import path from 'node:path';
import type { OpenAPIV3 } from 'openapi-types';
import {
  getBaselineHashPath,
  getBaselineSchemaPath,
  getNamespaceCacheDir,
} from './paths.js';

export async function ensureCacheDir(cwd: string, namespace: string): Promise<void> {
  await fs.mkdir(getNamespaceCacheDir(cwd, namespace), { recursive: true });
}

export async function readBaseline(
  cwd: string,
  namespace: string,
): Promise<OpenAPIV3.Document | null> {
  const schemaPath = getBaselineSchemaPath(cwd, namespace);
  try {
    const raw = await fs.readFile(schemaPath, 'utf-8');
    return JSON.parse(raw) as OpenAPIV3.Document;
  } catch {
    return null;
  }
}

export async function writeBaseline(
  cwd: string,
  namespace: string,
  parsed: OpenAPIV3.Document,
  hash: string,
): Promise<void> {
  await ensureCacheDir(cwd, namespace);
  const schemaPath = getBaselineSchemaPath(cwd, namespace);
  const hashPath = getBaselineHashPath(cwd, namespace);
  const tmp = `${schemaPath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(parsed, null, 2), 'utf-8');
  await fs.rename(tmp, schemaPath);
  await fs.writeFile(hashPath, hash, 'utf-8');
}
