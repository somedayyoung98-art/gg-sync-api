import { describe, expect, it } from 'vitest';
import {
  normalizeOpenApiForTooling,
  OPENAPI_TOOLING_VERSION,
} from '../../src/schema/normalize-openapi.js';

describe('normalizeOpenApiForTooling', () => {
  it('rewrites openapi 3.1.0 to 3.0.3', () => {
    const doc = normalizeOpenApiForTooling({
      openapi: '3.1.0',
      info: { title: 'T', version: '1' },
      paths: {},
    } as never);

    expect(doc.openapi).toBe(OPENAPI_TOOLING_VERSION);
  });

  it('is idempotent for 3.0.3', () => {
    const doc = {
      openapi: '3.0.3',
      info: { title: 'T', version: '1' },
      paths: {},
    } as const;
    expect(normalizeOpenApiForTooling(doc).openapi).toBe('3.0.3');
  });

  it('converts type array with null to nullable', () => {
    const doc = normalizeOpenApiForTooling({
      openapi: '3.1.0',
      info: { title: 'T', version: '1' },
      components: {
        schemas: {
          Item: {
            type: ['string', 'null'],
          },
        },
      },
      paths: {},
    } as never);

    const item = doc.components?.schemas?.Item as Record<string, unknown>;
    expect(item.type).toBe('string');
    expect(item.nullable).toBe(true);
  });

  it('strips jsonSchemaDialect', () => {
    const doc = normalizeOpenApiForTooling({
      openapi: '3.1.0',
      jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
      info: { title: 'T', version: '1' },
      paths: {},
    } as never);

    expect((doc as Record<string, unknown>).jsonSchemaDialect).toBeUndefined();
  });
});
