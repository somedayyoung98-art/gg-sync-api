export type {
  ApiSyncConfig,
  APIContract,
  DiffReport,
  DiffItem,
  GeneratorId,
  PipelineContext,
  ResolvedServiceConfig,
} from './pipeline/types.js';

export {
  loadConfig,
  resolveAllServices,
  resolveServiceConfig,
} from './config/load.js';
export {
  checkPeers,
  formatPeerCheckReport,
  type PeerCheckResult,
  type PeerIssue,
} from './doctor/check-peers.js';
export { loadPluginsForGenerators } from './doctor/load-plugins.js';
export { runDoctorStage, type DoctorStageResult } from './pipeline/stages/doctor.js';
export {
  apiSyncConfigSchema,
  generatorIdSchema,
  namespaceKeySchema,
} from './config/schema.js';
export {
  runPipeline,
  type PipelineMode,
  type NamespaceRunResult,
  type PipelineRunResult,
} from './pipeline/runner.js';
export {
  filterServicesByNamespace,
  listNamespaceIds,
} from './pipeline/namespace.js';
export { diffOpenApiSpecs, compareWithCache } from './diff/detector.js';
export { formatDiffReport } from './diff/format-report.js';
export { register, getGenerator, listGenerators } from './plugins/registry.js';
export { registerBuiltinPlugins } from './plugins/builtins.js';
export type { GeneratorPlugin } from './plugins/types.js';
export { pullSchema } from './schema/puller.js';
export { hashSchema } from './schema/hash.js';
export {
  getCacheRoot,
  getNamespaceCacheDir,
  getBaselineSchemaPath,
  getBaselineHashPath,
} from './cache/paths.js';
export { readBaseline, writeBaseline } from './cache/store.js';
