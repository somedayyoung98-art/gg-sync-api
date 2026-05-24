import path from 'node:path';
import { createJiti } from 'jiti';
import {
  apiSyncConfigSchema,
  type ApiSyncConfigInput,
} from './schema.js';
import type {
  ApiSyncConfig,
  ResolvedServiceConfig,
} from '../pipeline/types.js';

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
  const parsed = apiSyncConfigSchema.parse(
    (raw as { default?: unknown }).default ?? raw,
  );
  return parsed as ApiSyncConfig;
}

export function resolveServiceConfig(
  namespace: string,
  service: ApiSyncConfigInput['services'][string],
  global: ApiSyncConfig,
  strictFlag?: boolean,
): ResolvedServiceConfig {
  const envStrict = process.env.API_SYNC_STRICT === '1';
  const strict =
    strictFlag ??
    envStrict ??
    service.compliance?.strict ??
    global.compliance?.strict ??
    false;

  return {
    namespace,
    input: service.input,
    output: {
      ...service.output,
      keepSpec: service.output.keepSpec ?? false,
    },
    generators: service.generators ?? ['typescript', 'sdk'],
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
