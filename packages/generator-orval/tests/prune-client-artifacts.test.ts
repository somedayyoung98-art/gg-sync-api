import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { pruneClientArtifacts } from '../src/prune-client-artifacts';

describe('pruneClientArtifacts', () => {
  let tmp: string;

  afterEach(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it('removes sdk.ts when only typescript is enabled', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prune-'));
    await fs.writeFile(path.join(tmp, 'sdk.ts'), 'export const x = 1;\n', 'utf8');
    await fs.writeFile(path.join(tmp, 'sdk-request.ts'), 'export {};\n', 'utf8');
    await fs.writeFile(path.join(tmp, 'models.ts'), 'export interface A {}\n', 'utf8');

    await pruneClientArtifacts(tmp, ['typescript']);

    await expect(fs.stat(path.join(tmp, 'sdk.ts'))).rejects.toThrow();
    await expect(fs.stat(path.join(tmp, 'sdk-request.ts'))).rejects.toThrow();
    await expect(fs.stat(path.join(tmp, 'models.ts'))).resolves.toBeDefined();
  });

  it('keeps sdk.ts when sdk generator is enabled', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prune-'));
    await fs.writeFile(path.join(tmp, 'sdk.ts'), 'export const x = 1;\n', 'utf8');

    await pruneClientArtifacts(tmp, ['typescript', 'sdk']);

    await expect(fs.stat(path.join(tmp, 'sdk.ts'))).resolves.toBeDefined();
  });

  it('keeps both client artifacts when sdk and react-query are enabled', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prune-'));
    await fs.writeFile(path.join(tmp, 'sdk.ts'), 'export const sdk = 1;\n', 'utf8');
    await fs.writeFile(path.join(tmp, 'hooks.ts'), 'export const hooks = 1;\n', 'utf8');

    await pruneClientArtifacts(tmp, ['typescript', 'sdk', 'react-query']);

    await expect(fs.stat(path.join(tmp, 'sdk.ts'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(tmp, 'hooks.ts'))).resolves.toBeDefined();
  });

  it('removes stale mock artifacts when msw is disabled', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prune-'));
    await fs.writeFile(path.join(tmp, 'sdk.msw.ts'), 'export const handlers = [];\n', 'utf8');

    await pruneClientArtifacts(tmp, ['typescript', 'sdk']);

    await expect(fs.stat(path.join(tmp, 'sdk.msw.ts'))).rejects.toThrow();
  });

  it('removes stale zod.ts when zod is disabled', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prune-'));
    await fs.writeFile(path.join(tmp, 'zod.ts'), 'export const schema = {};' , 'utf8');

    await pruneClientArtifacts(tmp, ['typescript', 'sdk']);

    await expect(fs.stat(path.join(tmp, 'zod.ts'))).rejects.toThrow();
  });

});
