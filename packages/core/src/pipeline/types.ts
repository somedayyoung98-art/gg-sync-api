import type { OpenAPIV3 } from 'openapi-types';

export type GeneratorId = 'typescript' | 'sdk' | 'react-query' | 'msw' | 'zod';

export interface ServiceConfig {
  input: { url?: string; path?: string };
  output: {
    dir: string;
    /** `split` = one file per schema under models/; `single` = one models.ts */
    models?: 'split' | 'single';
  };
  generators?: GeneratorId[];
  compliance?: { strict?: boolean };
  runtime?: {
    baseURL?: string;
    timeout?: number;
    validationRate?: number;
  };
}

export interface ApiSyncConfig {
  compliance?: { strict?: boolean };
  runtime?: ServiceConfig['runtime'];
  services: Record<string, ServiceConfig>;
}

export interface ResolvedServiceConfig extends ServiceConfig {
  namespace: string;
  generators: GeneratorId[];
  compliance: { strict: boolean };
}

export interface APIContract {
  raw: string;
  parsed: OpenAPIV3.Document;
  hash: string;
}

export type DiffClassification = 'breaking' | 'non-breaking';

export interface DiffItem {
  code: string;
  path: string;
  classification: DiffClassification;
  message?: string;
}

export interface DiffReport {
  hasBreaking: boolean;
  breaking: DiffItem[];
  nonBreaking: DiffItem[];
  summary: string;
}

export interface PipelineMeta {
  outputDir: string;
  strictMode: boolean;
  hasBreakingChange: boolean;
  exitCode: number;
}

export interface PipelineContext {
  cwd: string;
  namespace: string;
  config: ResolvedServiceConfig;
  contract: APIContract;
  baseline: OpenAPIV3.Document | null;
  diff: DiffReport | null;
  meta: PipelineMeta;
}

export type PipelineStageName =
  | 'doctor'
  | 'pull'
  | 'diff'
  | 'strict-gate'
  | 'generate'
  | 'format'
  | 'cache-write';

export interface StageResult {
  name: PipelineStageName;
  durationMs: number;
  error?: string;
}
