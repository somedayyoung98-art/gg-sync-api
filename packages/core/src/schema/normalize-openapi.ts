import type { OpenAPIV3 } from 'openapi-types';

export const OPENAPI_TOOLING_VERSION = '3.0.3';

/** Top-level fields that openapi-diff / Swagger Parser 3.0.x reject or ignore. */
const DROP_ROOT_KEYS = new Set(['jsonSchemaDialect', 'webhooks']);

function isOpenApi31(version: unknown): boolean {
  return typeof version === 'string' && version.startsWith('3.1');
}

/**
 * Normalize OpenAPI 3.1 documents for diff/cache/codegen tooling (3.0.0–3.0.3 only).
 * Idempotent for documents already on 3.0.x.
 */
export function normalizeOpenApiForTooling<T extends OpenAPIV3.Document>(doc: T): T {
  const root = structuredClone(doc) as T & Record<string, unknown>;

  if (isOpenApi31(root.openapi)) {
    root.openapi = OPENAPI_TOOLING_VERSION;
  }

  for (const key of DROP_ROOT_KEYS) {
    delete root[key];
  }

  normalizeSchemaNodes(root);
  return root;
}

function normalizeSchemaNodes(node: unknown): void {
  if (node === null || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    for (const item of node) normalizeSchemaNodes(item);
    return;
  }

  const obj = node as Record<string, unknown>;

  if (Array.isArray(obj.type)) {
    normalizeTypeArray(obj);
  }

  if ('$schema' in obj) {
    delete obj.$schema;
  }

  for (const value of Object.values(obj)) {
    normalizeSchemaNodes(value);
  }
}

function normalizeTypeArray(obj: Record<string, unknown>): void {
  const types = obj.type.filter((t): t is string => typeof t === 'string');
  const nonNull = types.filter((t) => t !== 'null');

  if (types.includes('null') && nonNull.length === 1) {
    obj.type = nonNull[0];
    obj.nullable = true;
    return;
  }

  if (nonNull.length === 1) {
    obj.type = nonNull[0];
    return;
  }

  if (nonNull.length > 1) {
    obj.type = nonNull[0];
  }
}
