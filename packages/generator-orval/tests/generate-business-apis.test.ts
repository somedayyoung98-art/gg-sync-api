import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { PipelineContext } from '@somedayyoung/core';
import { generateBusinessApis } from '../src/generate-business-apis';

describe('generateBusinessApis', () => {
  let outputDir = '';

  afterEach(async () => {
    if (outputDir) await fs.rm(outputDir, { recursive: true, force: true });
  });

  async function context(businessApi: boolean): Promise<PipelineContext> {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'business-api-'));
    await fs.writeFile(
      path.join(outputDir, 'sdk.ts'),
      'export const getAccountGroupById = () => undefined;\n' +
        'export const createAccountGroup = () => undefined;\n' +
        'export const health = () => undefined;\n',
      'utf8',
    );

    return {
      cwd: outputDir,
      outputDir,
      config: {
        namespace: 'main',
        input: { kind: 'file', path: './openapi.json' },
        output: {
          dir: './generated',
          models: 'split',
          format: false,
          keepSpec: false,
        },
        generators: ['typescript', 'sdk'],
        sdk: { businessApi },
        compliance: { strict: false },
      },
      contract: {
        raw: '{}',
        parsed: {
          openapi: '3.0.3',
          info: { title: 'Test', version: '1.0.0' },
          paths: {
            '/account-groups/{id}': {
              get: {
                operationId: 'getAccountGroupById',
                tags: ['AccountGroup'],
                responses: {},
              },
            },
            '/account-groups': {
              post: {
                operationId: 'createAccountGroup',
                tags: ['AccountGroup'],
                responses: {},
              },
            },
            '/health': {
              get: { operationId: 'health', responses: {} },
            },
          },
        },
        hash: 'hash',
      },
      baseline: { kind: 'missing' },
      diff: {
        hasBreaking: false,
        breaking: [],
        nonBreaking: [],
        summary: 'unchanged',
      },
    };
  }

  it('groups tagged operations when enabled and leaves untagged methods flat', async () => {
    const ctx = await context(true);

    await generateBusinessApis(ctx);

    const source = await fs.readFile(path.join(outputDir, 'sdk.ts'), 'utf8');
    expect(source).toContain('export const accountGroupApi = {');
    expect(source).toContain('getAccountGroupById,');
    expect(source).toContain('createAccountGroup,');
    expect(source).not.toContain('healthApi');
  });

  it('keeps the flat SDK unchanged when business APIs are disabled', async () => {
    const ctx = await context(false);
    const sdkPath = path.join(outputDir, 'sdk.ts');
    const before = await fs.readFile(sdkPath, 'utf8');

    await generateBusinessApis(ctx);

    await expect(fs.readFile(sdkPath, 'utf8')).resolves.toBe(before);
  });
});
