import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { pullSchema } from '../../src/schema/puller';
import type { ResolvedServiceConfig } from '../../src/pipeline/types';

function service(inputPath: string): ResolvedServiceConfig {
  return {
    namespace: 'main',
    input: { kind: 'file', path: inputPath },
    output: {
      dir: './generated',
      models: 'split',
      format: false,
      keepSpec: false,
    },
    generators: ['typescript'],
    compliance: { strict: false },
  };
}

describe('schema puller', () => {
  let tmp = '';

  afterEach(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it('bundles relative external refs from the OpenAPI file directory', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-puller-'));
    const specDir = path.join(tmp, 'contracts');
    await fs.mkdir(path.join(specDir, 'schemas'), { recursive: true });
    await fs.writeFile(
      path.join(specDir, 'schemas/item.json'),
      JSON.stringify({
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      }),
      'utf8',
    );
    await fs.writeFile(
      path.join(specDir, 'openapi.json'),
      JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'External refs', version: '1.0.0' },
        paths: {},
        components: {
          schemas: { Item: { $ref: './schemas/item.json' } },
        },
      }),
      'utf8',
    );

    const contract = await pullSchema(tmp, service('./contracts/openapi.json'));

    expect(contract.parsed.components?.schemas?.Item).toMatchObject({
      type: 'object',
      required: ['id'],
    });
  });

  it('rejects a document that is not a valid OpenAPI contract', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-puller-'));
    await fs.writeFile(
      path.join(tmp, 'invalid.json'),
      JSON.stringify({ openapi: '3.0.3', paths: {} }),
      'utf8',
    );

    await expect(pullSchema(tmp, service('./invalid.json'))).rejects.toThrow();
  });

  it('preserves valid recursive schema references', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-puller-'));
    await fs.writeFile(
      path.join(tmp, 'recursive.json'),
      JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'Recursive schema', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            TreeNode: {
              type: 'object',
              required: ['id', 'children'],
              properties: {
                id: { type: 'string' },
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

    const contract = await pullSchema(tmp, service('./recursive.json'));
    const treeNode = contract.parsed.components?.schemas?.TreeNode as {
      properties?: { children?: { items?: { $ref?: string } } };
    };

    expect(treeNode.properties?.children?.items?.$ref).toBe(
      '#/components/schemas/TreeNode',
    );
  });
});
