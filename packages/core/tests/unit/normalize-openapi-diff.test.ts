import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { diffOpenApiSpecs } from '../../src/diff/detector.js';
import { normalizeOpenApiForTooling } from '../../src/schema/normalize-openapi.js';

const fixturePath = path.resolve(import.meta.dirname, '../fixtures/remote-openapi-31.json');

describe('normalizeOpenApiForTooling + diff', () => {
  it('diff does not throw when baseline was stored as OpenAPI 3.1.0', async () => {
    const raw = JSON.parse(await fs.readFile(fixturePath, 'utf8')) as Record<string, unknown>;
    expect(raw.openapi).toBe('3.1.0');

    const baseline = normalizeOpenApiForTooling(raw as never);
    const incoming = normalizeOpenApiForTooling(structuredClone(raw) as never);

    await expect(diffOpenApiSpecs(baseline, incoming)).resolves.toMatchObject({
      hasBreaking: false,
    });
  });
});
