import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runScaffold, SCAFFOLD_FILES } from '../../src/scaffold/run.js';
import { scaffoldCommand } from '../../src/commands/scaffold.js';

describe('sync-api scaffold', () => {
  let tmp: string;

  afterEach(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it('creates three-layer layout in an empty directory', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-scaffold-'));

    const result = await runScaffold({ cwd: tmp });
    expect(result.exitCode).toBe(0);
    expect(result.created).toHaveLength(SCAFFOLD_FILES.length);

    const apiRoot = path.join(tmp, 'src/api');
    await expect(fs.stat(path.join(apiRoot, 'runtime/client.ts'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(apiRoot, 'domain/index.ts'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(apiRoot, 'generated/.gitignore'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(apiRoot, 'generated/README.md'))).resolves.toBeDefined();

    const readme = await fs.readFile(
      path.join(apiRoot, 'generated/README.md'),
      'utf8',
    );
    expect(readme).toMatch(/must not import from `generated\//i);
    expect(readme).toMatch(/domain/i);

    const domain = await fs.readFile(path.join(apiRoot, 'domain/index.ts'), 'utf8');
    expect(domain).toMatch(/DO NOT import from `..\/generated\//);

    const client = await fs.readFile(path.join(apiRoot, 'runtime/client.ts'), 'utf8');
    expect(client).toContain('@gg-sync/runtime');
  });

  it('skips existing files without --force', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-scaffold-'));
    await runScaffold({ cwd: tmp });

    const second = await runScaffold({ cwd: tmp });
    expect(second.created).toHaveLength(0);
    expect(second.skipped.length).toBeGreaterThan(0);
  });

  it('--force replaces only empty stub files', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-scaffold-'));
    await runScaffold({ cwd: tmp });

    const domainPath = path.join(tmp, 'src/api/domain/index.ts');
    await fs.writeFile(domainPath, '// custom facade\nexport const x = 1;\n', 'utf8');

    const emptyRuntime = path.join(tmp, 'src/api/runtime/client.ts');
    await fs.writeFile(emptyRuntime, '', 'utf8');

    const forced = await runScaffold({ cwd: tmp, force: true });
    expect(forced.skipped.some((s) => s.includes('domain/index.ts'))).toBe(true);
    expect(forced.created).toContain('runtime/client.ts');

    const domain = await fs.readFile(domainPath, 'utf8');
    expect(domain).toContain('custom facade');

    const client = await fs.readFile(emptyRuntime, 'utf8');
    expect(client).toContain('@gg-sync/runtime');
  });

  it('scaffoldCommand returns 0 on success', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-scaffold-'));
    const code = await scaffoldCommand({ cwd: tmp });
    expect(code).toBe(0);
  });
});
