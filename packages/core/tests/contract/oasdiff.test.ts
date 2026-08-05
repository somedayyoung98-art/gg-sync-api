import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { diffOpenApiSpecs } from '../../src/diff/detector';
import type { OpenAPIDocument } from '../../src/pipeline/types';

const fixturesDir = path.resolve(import.meta.dirname, '../fixtures/diff-matrix');

async function loadSpec(file: string): Promise<OpenAPIDocument> {
  return JSON.parse(await fs.readFile(path.join(fixturesDir, file), 'utf8'));
}

describe('oasdiff adapter', () => {
  it('reports removed endpoints as breaking', async () => {
    const report = await diffOpenApiSpecs(
      await loadSpec('baseline.json'),
      await loadSpec('breaking/delete-endpoint.json'),
    );

    expect(report.hasBreaking).toBe(true);
    expect(report.breaking[0]).toMatchObject({
      code: 'api-path-removed-without-deprecation',
      path: '/items/{id}',
    });
  });

  it('uses consumer semantics for response requiredness', async () => {
    const baseline = await loadSpec('baseline.json');

    await expect(
      diffOpenApiSpecs(
        baseline,
        await loadSpec('breaking/optional-to-required.json'),
      ),
    ).resolves.toMatchObject({ hasBreaking: false });
    await expect(
      diffOpenApiSpecs(
        baseline,
        await loadSpec('non-breaking/required-to-optional.json'),
      ),
    ).resolves.toMatchObject({ hasBreaking: true });
  });

  it('accepts OpenAPI 3.1 without version conversion', async () => {
    const fixturePath = path.resolve(
      import.meta.dirname,
      '../fixtures/remote-openapi-31.json',
    );
    const spec = JSON.parse(await fs.readFile(fixturePath, 'utf8'));

    await expect(diffOpenApiSpecs(spec, spec)).resolves.toMatchObject({
      hasBreaking: false,
      breaking: [],
      nonBreaking: [],
    });
  });
});
