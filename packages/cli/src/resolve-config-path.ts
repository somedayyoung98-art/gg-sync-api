import path from 'node:path';

export function resolveConfigPath(
  cwd: string,
  options: { config?: string; configPath?: string },
): string {
  const configFile = options.configPath ?? options.config;
  return configFile
    ? path.resolve(cwd, configFile)
    : path.join(cwd, 'api-sync.config.ts');
}
