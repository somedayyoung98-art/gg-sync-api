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

  it('uses openapi-typescript root types', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-models-'));
    await fs.mkdir(path.join(tmp, 'type'));
    const specPath = path.join(tmp, 'openapi.json');
    await fs.writeFile(
      specPath,
      JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'Types', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Item: {
              type: 'object',
              required: ['id'],
              properties: { id: { type: 'string' } },
            },
          },
        },
      }),
      'utf8',
    );
    const context = { outputDir: tmp } as PipelineContext;

    await generateSingleModels(context, specPath, 'type.ts');

    const source = await fs.readFile(path.join(tmp, 'type.ts'), 'utf8');
    expect(source).toContain('export type Item');
    expect(source).toMatch(/id:\s*string/);
    await expect(fs.stat(path.join(tmp, 'type'))).rejects.toThrow();
  });

  it('generates a recursive model without dereferencing the cycle', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-models-'));
    const specPath = path.join(tmp, 'openapi.json');
    await fs.writeFile(
      specPath,
      JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'Recursive types', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            TreeNode: {
              type: 'object',
              required: ['children'],
              properties: {
                children: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/TreeNode' },
                },
              },
            },
          },
        },
      }),
      'utf8',
    );

    await generateSingleModels(
      { outputDir: tmp } as PipelineContext,
      specPath,
      'type.ts',
    );

    const source = await fs.readFile(path.join(tmp, 'type.ts'), 'utf8');
    expect(source).toContain('components["schemas"]["TreeNode"][]');
  });
});
