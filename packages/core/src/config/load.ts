import path from 'node:path';
import { createJiti } from 'jiti';
import { fromZodError } from 'zod-validation-error';
import {
  apiSyncConfigSchema,
  type ApiSyncConfig,
  type ServiceConfig,
} from './schema';
import type { ResolvedServiceConfig } from '../pipeline/types';

export interface LoadConfigOptions {
  cwd?: string;
  configPath?: string;
  strictFlag?: boolean;
}

export async function loadConfig(
  options: LoadConfigOptions = {},
): Promise<ApiSyncConfig> {
  const cwd = options.cwd ?? process.cwd();
  const configPath =
    options.configPath ?? path.join(cwd, 'api-sync.config.ts');

  const jiti = createJiti(cwd, { interopDefault: true });
  const raw = await jiti.import(configPath);
  const result = apiSyncConfigSchema.safeParse(
    (raw as { default?: unknown }).default ?? raw,
  );
  if (!result.success) {
    throw fromZodError(result.error, {
      prefix: `Invalid API Sync config: ${configPath}`,
    });
  }
  return result.data;
}

export function resolveServiceConfig(
  namespace: string,
  service: ServiceConfig,
  global: ApiSyncConfig,
  strictFlag?: boolean,
): ResolvedServiceConfig {
  const envStrict = process.env.API_SYNC_STRICT === '1' ? true : undefined;
  const strict =
    strictFlag ??
    envStrict ??
    service.compliance?.strict ??
    global.compliance?.strict ??
    false;

  return {
    namespace,
    input: 'path' in service.input
      ? { kind: 'file', path: service.input.path }
      : { kind: 'url', url: service.input.url },
    output: {
      ...service.output,
      models: service.output.models ?? 'split',
      format: service.output.format ?? 'auto',
      keepSpec: service.output.keepSpec ?? false,
    },
    generators: service.generators ?? ['typescript', 'sdk'],
    sdk: service.sdk,
    compliance: { strict },
    runtime: { ...global.runtime, ...service.runtime },
  };
}

export function resolveAllServices(
  config: ApiSyncConfig,
  strictFlag?: boolean,
): ResolvedServiceConfig[] {
  return Object.entries(config.services).map(([ns, svc]) =>
    resolveServiceConfig(ns, svc, config, strictFlag),
  );
}
