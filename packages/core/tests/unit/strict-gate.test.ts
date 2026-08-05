import { describe, expect, it } from 'vitest';
import { runStrictGate } from '../../src/pipeline/stages/strict-gate';
import type { PipelineContext } from '../../src/pipeline/types';

function context(strict: boolean, hasBreaking: boolean): PipelineContext {
  return {
    cwd: '/project',
    config: {
      namespace: 'main',
      input: { kind: 'file', path: '/project/openapi.json' },
      output: {
        dir: './generated',
        models: 'split',
        format: false,
        keepSpec: false,
      },
      generators: ['typescript'],
      compliance: { strict },
    },
    contract: {
      raw: '{}',
      parsed: {} as PipelineContext['contract']['parsed'],
      hash: 'hash',
    },
    baseline: { kind: 'missing' },
    diff: {
      hasBreaking,
      breaking: [],
      nonBreaking: [],
      summary: hasBreaking ? 'breaking' : 'unchanged',
    },
    outputDir: '/project/generated',
  };
}

describe('strict gate', () => {
  it('blocks a breaking contract in strict mode', () => {
    expect(runStrictGate(context(true, true)).kind).toBe('blocked');
  });

  it.each([
    [false, true],
    [true, false],
    [false, false],
  ])('proceeds when strict=%s and breaking=%s', (strict, hasBreaking) => {
    expect(runStrictGate(context(strict, hasBreaking)).kind).toBe('proceed');
  });
});
