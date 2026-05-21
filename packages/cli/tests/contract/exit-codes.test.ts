import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { writeBaseline } from '@gg-sync/core';
import { diffCommand } from '../../src/commands/diff.js';
import { runCommand } from '../../src/commands/run.js';

const fixturesRoot = path.resolve(
  import.meta.dirname,
  '../../../core/tests/fixtures/diff-matrix',
);

async function seedProject(
  tmp: string,
  inputRelative: string,
): Promise<void> {
  const baseline = JSON.parse(
    await fs.readFile(path.join(fixturesRoot, 'baseline.json'), 'utf8'),
  );
  await writeBaseline(tmp, 'main', baseline, 'fixture-hash');

  const config = `export default {
  services: {
    main: {
      input: { path: '${inputRelative.replace(/\\/g, '/')}' },
      output: { dir: './out' },
      generators: ['typescript', 'sdk'],
    },
  },
};
`;
  await fs.writeFile(path.join(tmp, 'api-sync.config.ts'), config, 'utf8');
  await fs.mkdir(path.join(tmp, 'out'), { recursive: true });
}

describe('CLI exit codes (strict diff)', () => {
  let tmp: string;
  const prevStrict = process.env.API_SYNC_STRICT;

  afterEach(async () => {
    process.env.API_SYNC_STRICT = prevStrict;
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  beforeAll(async () => {
    await import('@gg-sync/generator-orval');
  });

  it('diff --strict exits 1 on breaking fixture', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-cli-'));
    const breakingPath = path.join(tmp, 'breaking.json');
    await fs.copyFile(
      path.join(fixturesRoot, 'breaking/delete-endpoint.json'),
      breakingPath,
    );
    await seedProject(tmp, './breaking.json');

    const code = await diffCommand({
      cwd: tmp,
      config: './api-sync.config.ts',
      strict: true,
    });
    expect(code).toBe(1);
  });

  it('diff --strict exits 0 on non-breaking fixture', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-cli-'));
    const nbPath = path.join(tmp, 'non-breaking.json');
    await fs.copyFile(
      path.join(fixturesRoot, 'non-breaking/add-property.json'),
      nbPath,
    );
    await seedProject(tmp, './non-breaking.json');

    const code = await diffCommand({
      cwd: tmp,
      config: './api-sync.config.ts',
      strict: true,
    });
    expect(code).toBe(0);
  });

  it('API_SYNC_STRICT=1 exits 1 on breaking via run', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-cli-'));
    const breakingPath = path.join(tmp, 'breaking.json');
    await fs.copyFile(
      path.join(fixturesRoot, 'breaking/delete-endpoint.json'),
      breakingPath,
    );
    await seedProject(tmp, './breaking.json');
    process.env.API_SYNC_STRICT = '1';

    const code = await runCommand({
      cwd: tmp,
      config: './api-sync.config.ts',
    });
    expect(code).toBe(1);
  });
});
