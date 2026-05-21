import type { OpenAPIV3 } from 'openapi-types';
import type { DiffItem, DiffReport } from '../pipeline/types.js';
import type { OpenApiDiffDifference, OpenApiDiffResult } from './types.js';

const MATRIX_CODES: Record<string, string> = {
  'path.remove': 'DELETE_ENDPOINT',
  'path-method.remove': 'CHANGE_HTTP_METHOD',
  'request.parameter.required.add': 'OPTIONAL_TO_REQUIRED',
  'response.body.schema.type.change': 'PROPERTY_TYPE_CHANGE',
  'response.body.schema.required.remove': 'DELETE_PROPERTY',
  'response.body.schema.required.add': 'REQUIRED_TO_OPTIONAL',
  'response.body.scope.remove': 'ADD_PROPERTY',
};

type SchemaObject = OpenAPIV3.SchemaObject;

function isSchemaObject(value: unknown): value is SchemaObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('type' in value || 'properties' in value || '$ref' in value)
  );
}

function diffPath(d: OpenApiDiffDifference): string {
  const detail =
    d.sourceSpecEntityDetails?.[0] ?? d.destinationSpecEntityDetails?.[0];
  const location = detail?.location ?? d.entity;
  return location.replace(/^paths\./, '/').replace(/\./g, ' ');
}

function toDiffItem(d: OpenApiDiffDifference): DiffItem {
  const classification =
    d.type === 'non-breaking' ? 'non-breaking' : 'breaking';
  return {
    code: MATRIX_CODES[d.code] ?? d.code,
    path: diffPath(d),
    classification,
    message: `${d.action} ${d.entity} (${d.code})`,
  };
}

function collectSchemaPairs(
  baseline: OpenAPIV3.Document,
  incoming: OpenAPIV3.Document,
): Array<{ path: string; baseline: SchemaObject; incoming: SchemaObject }> {
  const pairs: Array<{
    path: string;
    baseline: SchemaObject;
    incoming: SchemaObject;
  }> = [];

  for (const [name, schema] of Object.entries(baseline.components?.schemas ?? {})) {
    const next = incoming.components?.schemas?.[name];
    if (isSchemaObject(schema) && isSchemaObject(next)) {
      pairs.push({
        path: `components.schemas.${name}`,
        baseline: schema,
        incoming: next,
      });
    }
  }

  for (const [route, pathItem] of Object.entries(baseline.paths ?? {})) {
    const nextPathItem = incoming.paths?.[route];
    if (!pathItem || !nextPathItem) continue;

    for (const [method, operation] of Object.entries(pathItem)) {
      if (method === 'parameters' || method === '$ref') continue;
      const nextOp = (nextPathItem as OpenAPIV3.PathItemObject)[
        method as keyof OpenAPIV3.PathItemObject
      ];
      if (!operation || typeof operation !== 'object' || !nextOp) continue;

      const op = operation as OpenAPIV3.OperationObject;
      const nextOperation = nextOp as OpenAPIV3.OperationObject;

      for (const [status, response] of Object.entries(op.responses ?? {})) {
        const nextResponse = nextOperation.responses?.[status];
        const schema = (response as OpenAPIV3.ResponseObject)?.content?.[
          'application/json'
        ]?.schema;
        const nextSchema = (nextResponse as OpenAPIV3.ResponseObject)?.content?.[
          'application/json'
        ]?.schema;
        if (isSchemaObject(schema) && isSchemaObject(nextSchema)) {
          pairs.push({
            path: `paths.${route}.${method}.responses.${status}`,
            baseline: schema,
            incoming: nextSchema,
          });
        }
      }
    }
  }

  return pairs;
}

/** Spec matrix overrides where openapi-diff classification differs. */
function detectRequiredMatrixOverrides(
  baseline: OpenAPIV3.Document,
  incoming: OpenAPIV3.Document,
): { breaking: DiffItem[]; nonBreaking: DiffItem[] } {
  const breaking: DiffItem[] = [];
  const nonBreaking: DiffItem[] = [];

  for (const { path, baseline: bSchema, incoming: iSchema } of collectSchemaPairs(
    baseline,
    incoming,
  )) {
    const bReq = new Set(bSchema.required ?? []);
    const iReq = new Set(iSchema.required ?? []);
    const props = new Set([
      ...Object.keys(bSchema.properties ?? {}),
      ...Object.keys(iSchema.properties ?? {}),
    ]);

    for (const prop of props) {
      if (iReq.has(prop) && !bReq.has(prop)) {
        breaking.push({
          code: 'OPTIONAL_TO_REQUIRED',
          path: `${path}.${prop}`,
          classification: 'breaking',
          message: `Property "${prop}" became required (Contract Diff Matrix)`,
        });
      }
      if (bReq.has(prop) && !iReq.has(prop)) {
        nonBreaking.push({
          code: 'REQUIRED_TO_OPTIONAL',
          path: `${path}.${prop}`,
          classification: 'non-breaking',
          message: `Property "${prop}" became optional (Contract Diff Matrix)`,
        });
      }
    }
  }

  return { breaking, nonBreaking };
}

/** openapi-diff may mark required→optional response scope changes as breaking. */
function downgradeRequiredToOptionalFalsePositives(
  breaking: DiffItem[],
  requiredToOptional: DiffItem[],
): { breaking: DiffItem[]; nonBreaking: DiffItem[] } {
  const relaxed = requiredToOptional.filter(
    (n) => n.code === 'REQUIRED_TO_OPTIONAL',
  );
  if (relaxed.length === 0) {
    return { breaking, nonBreaking: [] };
  }

  const keptBreaking: DiffItem[] = [];
  const downgraded: DiffItem[] = [];

  for (const item of breaking) {
    const scopeFalsePositive =
      item.code === 'response.body.scope.add' ||
      item.message?.includes('response.body.scope.add');
    if (scopeFalsePositive) {
      downgraded.push({
        ...item,
        code: 'REQUIRED_TO_OPTIONAL',
        classification: 'non-breaking',
        message: item.message
          ? `${item.message} (Contract Diff Matrix)`
          : 'Required property became optional (Contract Diff Matrix)',
      });
    } else {
      keptBreaking.push(item);
    }
  }

  return { breaking: keptBreaking, nonBreaking: downgraded };
}

function dedupeItems(items: DiffItem[]): DiffItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.code}|${item.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSummary(report: DiffReport): string {
  if (report.breaking.length === 0 && report.nonBreaking.length === 0) {
    return 'Contract unchanged vs baseline.';
  }
  const parts: string[] = [];
  if (report.breaking.length > 0) {
    parts.push(`${report.breaking.length} breaking`);
  }
  if (report.nonBreaking.length > 0) {
    parts.push(`${report.nonBreaking.length} non-breaking`);
  }
  return `Contract diff: ${parts.join(', ')}.`;
}

export function mapOpenApiDiffToReport(
  result: OpenApiDiffResult,
  baseline?: OpenAPIV3.Document,
  incoming?: OpenAPIV3.Document,
): DiffReport {
  let breaking = (result.breakingDifferences ?? []).map(toDiffItem);
  let nonBreaking = (result.nonBreakingDifferences ?? []).map(toDiffItem);
  const unclassified = (result.unclassifiedDifferences ?? []).map((d) =>
    toDiffItem({ ...d, type: 'breaking' }),
  );

  if (baseline && incoming) {
    const overrides = detectRequiredMatrixOverrides(baseline, incoming);
    const downgraded = downgradeRequiredToOptionalFalsePositives(
      breaking,
      overrides.nonBreaking,
    );
    breaking = dedupeItems([...downgraded.breaking, ...overrides.breaking]);
    nonBreaking = dedupeItems([
      ...nonBreaking,
      ...downgraded.nonBreaking,
      ...overrides.nonBreaking,
    ]);

    const breakingProps = new Set(
      overrides.breaking.map((b) => b.path.split('.').pop()),
    );
    nonBreaking = nonBreaking.filter((item) => {
      const prop = item.path.split(/[\s./]+/).pop();
      return !prop || !breakingProps.has(prop);
    });
  }

  const allBreaking = dedupeItems([...breaking, ...unclassified]);

  const report: DiffReport = {
    hasBreaking: allBreaking.length > 0,
    breaking: allBreaking,
    nonBreaking,
    summary: '',
  };
  report.summary = buildSummary(report);
  return report;
}
