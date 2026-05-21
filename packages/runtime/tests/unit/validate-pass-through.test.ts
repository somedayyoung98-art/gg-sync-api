import { afterEach, describe, expect, it, vi } from 'vitest';
import { shouldSampleValidation } from '../../src/sampling.js';
import { validateResponse } from '../../src/validate.js';

describe('validateResponse pass-through', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed data when schema matches', () => {
    const data = validateResponse(
      { id: '1', name: 'Ada' },
      {
        parse: (d) => {
          const o = d as { id: string; name: string };
          if (!o.id || !o.name) throw new Error('invalid');
          return o;
        },
      },
      { method: 'get', url: '/users/1' },
    );
    expect(data).toEqual({ id: '1', name: 'Ada' });
  });

  it('logs structured warning and returns raw payload on failure', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const raw = { id: 123, name: 'Ada' };

    const result = validateResponse(
      raw,
      {
        parse: (d) => {
          const o = d as { id: string };
          if (typeof o.id !== 'string') {
            const err = new Error('type mismatch') as Error & {
              issues: Array<Record<string, unknown>>;
            };
            err.issues = [
              {
                path: ['id'],
                message: 'Expected string',
                expected: 'string',
                received: 'number',
              },
            ];
            throw err;
          }
          return o;
        },
      },
      { method: 'get', url: '/users/1' },
    );

    expect(result).toBe(raw);
    expect(warn).toHaveBeenCalledOnce();
    const payload = warn.mock.calls[0]?.[1] as {
      endpoint: string;
      issues: Array<{ path: string }>;
    };
    expect(payload.endpoint).toBe('GET /users/1');
    expect(payload.issues[0]?.path).toBe('id');
  });
});

describe('shouldSampleValidation', () => {
  it('always validates at rate 1', () => {
    expect(shouldSampleValidation(1)).toBe(true);
  });

  it('never validates at rate 0', () => {
    expect(shouldSampleValidation(0)).toBe(false);
  });
});
