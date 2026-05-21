import {
  filterServicesByNamespace,
  listNamespaceIds,
  type ResolvedServiceConfig,
} from '@gg-sync/core';

export interface SharedCommandOptions {
  config?: string;
  strict?: boolean;
  cwd?: string;
  namespace?: string;
}

export function resolveStrictFlag(cliStrict?: boolean): boolean | undefined {
  if (cliStrict === true) return true;
  if (process.env.API_SYNC_STRICT === '1') return true;
  return cliStrict;
}

export function resolveNamespaceFilter(
  services: ResolvedServiceConfig[],
  namespace?: string,
): string | undefined {
  if (!namespace) return undefined;
  filterServicesByNamespace(services, namespace);
  return namespace;
}

export function formatNamespaceList(services: ResolvedServiceConfig[]): string {
  return listNamespaceIds(services).join(', ');
}

export function attachSharedOptions(
  cmd: {
    option: (
      flags: string,
      description: string,
      config?: { default?: string },
    ) => typeof cmd;
  },
): void {
  cmd
    .option('--config <path>', 'Config file path', { default: './api-sync.config.ts' })
    .option('--strict', 'Fail on breaking contract changes (or API_SYNC_STRICT=1)')
    .option('--cwd <dir>', 'Working directory')
    .option(
      '--namespace <id>',
      'Run a single service namespace (see config services keys)',
    );
}
