import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { execPmBuild, execSyncApi } from './lib/pm-exec';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const exampleDir = path.join(repoRoot, 'examples/single-service');
const cliDist = path.join(repoRoot, 'packages/cli/dist/index.js');

function runSyncApi(args: string[] = ['run']): void {
  execSyncApi(args, { cwd: exampleDir, stdio: 'pipe' });
}

beforeAll(() => {
  if (!fs.existsSync(cliDist)) {
    execPmBuild(repoRoot);
  }
});

describe('examples/single-service e2e', () => {
  it('generates SDK and models via @somedayyoung/api-sync', () => {
    runSyncApi(['run']);

    const generated = path.join(exampleDir, 'src/api/generated');
    expect(fs.existsSync(path.join(generated, 'sdk.ts'))).toBe(true);
    expect(fs.existsSync(path.join(generated, 'models/index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(exampleDir, '.api-sync-cache/main/latest-schema.json'))).toBe(
      true,
    );
  });

  it('exits 0 on diff-only against baseline', () => {
    expect(() => runSyncApi(['diff'])).not.toThrow();
  });
});
