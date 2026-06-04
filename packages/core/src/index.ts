export type {
  ApiSyncConfig,
  APIContract,
  DiffReport,
  DiffItem,
  GeneratorId,
  PipelineContext,
  ResolvedServiceConfig,
} from './pipeline/types';

export {
  loadConfig,
  resolveAllServices,
  resolveServiceConfig,
} from './config/load';
export {
  checkPeers,
  formatPeerCheckReport,
  type PeerCheckResult,
  type PeerIssue,
} from './doctor/check-peers';
export {
  loadPluginsForGenerators,
  type PluginLoadIssue,
} from './doctor/load-plugins';
export { runDoctorStage, type DoctorStageResult } from './pipeline/stages/doctor';
export {
  apiSyncConfigSchema,
  generatorIdSchema,
  namespaceKeySchema,
} from './config/schema';
export {
  runPipeline,
  type PipelineMode,
  type NamespaceRunResult,
  type PipelineRunResult,
} from './pipeline/runner';
export {
  filterServicesByNamespace,
  listNamespaceIds,
} from './pipeline/namespace';
export { diffOpenApiSpecs, compareWithCache } from './diff/detector';
export { formatDiffReport } from './diff/format-report';
export { register, getGenerator, listGenerators } from './plugins/registry';
export { registerBuiltinPlugins } from './plugins/builtins';
export type { GeneratorPlugin } from './plugins/types';
export { pullSchema } from './schema/puller';
export { hashSchema } from './schema/hash';
export {
  normalizeOpenApiForTooling,
  OPENAPI_TOOLING_VERSION,
} from './schema/normalize-openapi';
export {
  getCacheRoot,
  getNamespaceCacheDir,
  getBaselineSchemaPath,
  getBaselineHashPath,
} from './cache/paths';
export { readBaseline, writeBaseline } from './cache/store';
