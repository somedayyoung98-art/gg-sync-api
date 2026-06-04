import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exampleRoot = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(exampleRoot, '.env') });

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and set it.`,
    );
  }
  return value;
}

export function getOpenApiHost(): string {
  return process.env.OPENAPI_HOST?.trim() || '127.0.0.1';
}

export function getOpenApiPort(): number {
  return Number(process.env.OPENAPI_PORT ?? 3100);
}

/** URL shown in generated OpenAPI `servers` and used by dump/sync when pointing at local Koa. */
export function getOpenApiServerUrl(): string {
  const explicit = process.env.OPENAPI_SERVER_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  return `http://${getOpenApiHost()}:${getOpenApiPort()}`;
}
