import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readBaseline, writeBaseline } from '../../src/cache/store.js';

describe('cache store', () => {
  let tmp: string;

  afterEach(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it('writes and reads baseline atomically', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-cache-'));
    const doc = {
      openapi: '3.0.0',
      info: { title: 'T', version: '1' },
      paths: {},
    };
    await writeBaseline(tmp, 'main', doc as never, 'abc123');
    const loaded = await readBaseline(tmp, 'main');
    expect(loaded?.info.title).toBe('T');
  });
});
