import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import type {
  GeneratorId,
  ModelsOutput,
  ServiceConfig,
} from '../config/schema';

export type { GeneratorId } from '../config/schema';

export type InputSource =
  | { kind: 'file'; path: string }
  | { kind: 'url'; url: string };

export type OpenAPIDocument =
  | OpenAPIV3.Document
  | OpenAPIV3_1.Document;

export interface ResolvedServiceConfig {
  namespace: string;
  input: InputSource;
  output: {
    dir: string;
    models: ModelsOutput;
    format: 'auto' | 'prettier' | false;
    keepSpec: boolean;
  };
  generators: GeneratorId[];
  sdk?: ServiceConfig['sdk'];
  compliance: { strict: boolean };
  runtime?: ServiceConfig['runtime'];
}

export interface APIContract {
  raw: string;
  parsed: OpenAPIDocument;
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

export type Baseline =
  | { kind: 'missing' }
  | { kind: 'present'; document: OpenAPIDocument };

interface ServiceRunContext {
  cwd: string;
  config: ResolvedServiceConfig;
  outputDir: string;
}

export interface PulledContext extends ServiceRunContext {
  contract: APIContract;
  baseline: Baseline;
}

export interface PipelineContext extends PulledContext {
  diff: DiffReport;
}

export type GateDecision =
  | { kind: 'proceed'; context: PipelineContext }
  | { kind: 'blocked'; context: PipelineContext };
