export type {
  APIContract,
  DiffReport,
  DiffItem,
  InputSource,
  Baseline,
  PulledContext,
  PipelineContext,
  GateDecision,
  OpenAPIDocument,
  ResolvedServiceConfig,
} from './pipeline/types';
export type {
  ApiSyncConfig,
  ServiceConfig,
  GeneratorId,
  ModelsOutput,
} from './config/schema';

export {
  loadConfig,
  resolveAllServices,
  resolveServiceConfig,
} from './config/load';
export {
  apiSyncConfigSchema,
  defineConfig,
  generatorIdSchema,
  modelsOutputSchema,
  namespaceKeySchema,
} from './config/schema';
export {
  runPipeline,
  type PipelineMode,
  type ServiceOutcome,
  type PipelineRunResult,
} from './pipeline/runner';
export {
  filterServicesByNamespace,
  listNamespaceIds,
} from './pipeline/namespace';
export { diffOpenApiSpecs, compareWithCache } from './diff/detector';
export { formatDiffReport } from './diff/format-report';
export { registerGenerator } from './plugins/registry';
export type { CodeGenerator } from './plugins/types';
export { pullSchema } from './schema/puller';
export { hashSchema } from './schema/hash';
export {
  getCacheRoot,
  getNamespaceCacheDir,
  getBaselineSchemaPath,
  getBaselineHashPath,
} from './cache/paths';
export { readBaseline, writeBaseline } from './cache/store';
