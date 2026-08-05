import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { PipelineContext } from '@somedayyoung/core';
import { generateSingleModels } from '../src/generate-single-models';

describe('single models generation', () => {
  let tmp = '';

  afterEach(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it('bundles the complete Orval model surface without OpenAPI containers', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-models-'));
    const modelsDir = path.join(tmp, 'type');
    await fs.mkdir(modelsDir);
    await fs.writeFile(
      path.join(modelsDir, 'item.ts'),
      'export interface Item { id: string }\n',
      'utf8',
    );
    await fs.writeFile(
      path.join(modelsDir, 'createItemBody.ts'),
      'export interface CreateItemBody { name: string }\n',
      'utf8',
    );
    await fs.writeFile(
      path.join(modelsDir, 'createItemResponse.ts'),
      `import type { Item } from './item';\nexport type CreateItemResponse = Item;\n`,
      'utf8',
    );
    await fs.writeFile(
      path.join(modelsDir, 'index.ts'),
      `export * from './item';\nexport * from './createItemBody';\nexport * from './createItemResponse';\n`,
      'utf8',
    );
    const context = { outputDir: tmp } as PipelineContext;

    await generateSingleModels(context, 'type.ts');

    const source = await fs.readFile(path.join(tmp, 'type.ts'), 'utf8');
    expect(source).toContain('interface Item');
    expect(source).toContain('interface CreateItemBody');
    expect(source).toContain('type CreateItemResponse = Item');
    expect(source).toMatch(/export type \{[^}]*Item[^}]*\}/s);
    expect(source).toMatch(/id:\s*string/);
    expect(source).not.toMatch(
      /export (?:interface|type) (?:paths|webhooks|components|operations)\b/,
    );
    await expect(fs.stat(path.join(tmp, 'type'))).rejects.toThrow();
  });

  it('preserves recursive model references', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-models-'));
    const modelsDir = path.join(tmp, 'type');
    await fs.mkdir(modelsDir);
    await fs.writeFile(
      path.join(modelsDir, 'treeNode.ts'),
      'export interface TreeNode { children: TreeNode[] }\n',
      'utf8',
    );
    await fs.writeFile(
      path.join(modelsDir, 'index.ts'),
      `export * from './treeNode';\n`,
      'utf8',
    );

    await generateSingleModels(
      { outputDir: tmp } as PipelineContext,
      'type.ts',
    );

    const source = await fs.readFile(path.join(tmp, 'type.ts'), 'utf8');
    expect(source).toMatch(/children:\s*TreeNode\[\]/);
  });
});
