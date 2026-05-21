import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from '../../src/client.js';

/**
 * SC-009: malformed responses still reach callers; validation is log-only.
 */
describe('SC-009 runtime pass-through contract', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('returns original JSON when response violates schema', async () => {
    const malformed = { id: 999, extra: true };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => malformed,
    }) as typeof fetch;

    const client = createApiClient({ validationRate: 1 });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await client.fetch({
      url: '/items/1',
      method: 'get',
      responseSchema: {
        parse: (data: unknown) => {
          const row = data as { id: string };
          if (typeof row.id !== 'string') {
            throw Object.assign(new Error('invalid'), {
              issues: [
                {
                  path: ['id'],
                  message: 'Expected string',
                  expected: 'string',
                  received: typeof row.id,
                },
              ],
            });
          }
          return row;
        },
      },
    });

    expect(result).toEqual(malformed);
    expect(warn).toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('skips validation when validationRate is 0', async () => {
    const payload = { id: 1 };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => payload,
    }) as typeof fetch;

    const client = createApiClient({ validationRate: 0 });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await client.fetch({
      url: '/items/1',
      method: 'get',
      responseSchema: {
        parse: () => {
          throw new Error('should not run');
        },
      },
    });

    expect(warn).not.toHaveBeenCalled();
  });
});
