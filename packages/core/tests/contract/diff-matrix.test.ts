import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { OpenAPIV3 } from 'openapi-types';
import { diffOpenApiSpecs } from '../../src/diff/detector.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../fixtures/diff-matrix',
);

interface MatrixManifest {
  baseline: string;
  cases: Array<{
    id: string;
    file: string;
    expectBreaking: boolean;
    matrixRow: string;
  }>;
}

async function loadJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

describe('contract diff matrix (openapi-diff)', () => {
  it('classifies every manifest case per Contract Diff Matrix', async () => {
    const manifest = await loadJson<MatrixManifest>(
      path.join(fixturesDir, 'manifest.json'),
    );
    const baseline = await loadJson<OpenAPIV3.Document>(
      path.join(fixturesDir, manifest.baseline),
    );

    for (const testCase of manifest.cases) {
      const incoming = await loadJson<OpenAPIV3.Document>(
        path.join(fixturesDir, testCase.file),
      );
      const report = await diffOpenApiSpecs(baseline, incoming);

      expect(
        report.hasBreaking,
        `${testCase.id} (${testCase.matrixRow})`,
      ).toBe(testCase.expectBreaking);

      if (testCase.expectBreaking) {
        expect(report.breaking.length).toBeGreaterThan(0);
      } else {
        expect(report.breaking).toHaveLength(0);
        expect(report.nonBreaking.length).toBeGreaterThan(0);
      }
    }
  });
});
