/**
 * Umbrella entry — consumers install @somedayyoung/api-sync only.
 * CLI binary is re-exported via package.json bin field.
 */
import packageJson from '../package.json';

export const API_SYNC_VERSION = packageJson.version;

export { defineConfig } from '@somedayyoung/core';
export type {
  ApiSyncConfig,
  GeneratorId,
  ModelsOutput,
  ServiceConfig,
} from '@somedayyoung/core';
