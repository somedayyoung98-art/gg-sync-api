import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { consolidateModelsToSingleFile } from '../src/consolidate-models.js';

describe('consolidateModelsToSingleFile', () => {
  let tmp: string;

  afterEach(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it('merges models/*.ts into models.ts and removes the directory', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'consolidate-models-'));
    const modelsDir = path.join(tmp, 'models');
    await fs.mkdir(modelsDir, { recursive: true });
    await fs.writeFile(
      path.join(modelsDir, 'a.ts'),
      `/** header */\nexport interface A { x: string }\n`,
      'utf8',
    );
    await fs.writeFile(
      path.join(modelsDir, 'b.ts'),
      `/** header */\nimport type { A } from './a';\nexport interface B { ref: A }\n`,
      'utf8',
    );
    await fs.writeFile(path.join(modelsDir, 'index.ts'), `export * from './a';\n`, 'utf8');

    await consolidateModelsToSingleFile(tmp);

    const merged = await fs.readFile(path.join(tmp, 'models.ts'), 'utf8');
    expect(merged).toContain('export interface A');
    expect(merged).toContain('export interface B');
    expect(merged).not.toContain("from './a'");
    expect(merged.indexOf('export interface A')).toBeLessThan(merged.indexOf('export interface B'));
    await expect(fs.stat(modelsDir)).rejects.toThrow();
  });
});
