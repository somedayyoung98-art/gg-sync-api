import {
  runOasdiffBreakingFromSpecs,
  runOasdiffChangelogFromSpecs,
  type IOasdiffChange,
} from '@oasdiff-js/oasdiff-js';
import type {
  DiffClassification,
  DiffItem,
  DiffReport,
  OpenAPIDocument,
  PulledContext,
} from '../pipeline/types';

type Change = IOasdiffChange &
  Required<Pick<IOasdiffChange, 'fingerprint' | 'id' | 'path' | 'text'>>;

function toDiffItem(
  change: Change,
  classification: DiffClassification,
): DiffItem {
  return {
    code: change.id,
    path: change.path,
    classification,
    message: change.text,
  };
}

export async function diffOpenApiSpecs(
  baseline: OpenAPIDocument,
  incoming: OpenAPIDocument,
): Promise<DiffReport> {
  const [breakingResult, changelogResult] = await Promise.all([
    runOasdiffBreakingFromSpecs(baseline, incoming, { format: 'json' }),
    runOasdiffChangelogFromSpecs(baseline, incoming, { format: 'json' }),
  ]);
  const breakingChanges = breakingResult.changes as Change[];
  const breakingFingerprints = new Set(
    breakingChanges.map((change) => change.fingerprint),
  );
  const nonBreakingChanges = (changelogResult.changes as Change[]).filter(
    (change) => !breakingFingerprints.has(change.fingerprint),
  );
  const breaking = breakingChanges.map((change) =>
    toDiffItem(change, 'breaking'),
  );
  const nonBreaking = nonBreakingChanges.map((change) =>
    toDiffItem(change, 'non-breaking'),
  );
  const counts = [
    breaking.length > 0 ? `${breaking.length} breaking` : '',
    nonBreaking.length > 0 ? `${nonBreaking.length} non-breaking` : '',
  ].filter(Boolean);

  return {
    hasBreaking: breaking.length > 0,
    breaking,
    nonBreaking,
    summary:
      counts.length === 0
        ? 'Contract unchanged vs baseline.'
        : `Contract diff: ${counts.join(', ')}.`,
  };
}

export async function compareWithCache(ctx: PulledContext): Promise<DiffReport> {
  if (ctx.baseline.kind === 'missing') {
    return {
      hasBreaking: false,
      breaking: [],
      nonBreaking: [],
      summary: 'No local cache found. First initialization.',
    };
  }

  return diffOpenApiSpecs(ctx.baseline.document, ctx.contract.parsed);
}
