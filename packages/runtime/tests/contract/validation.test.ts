import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from '../../src/client';

describe('runtime response validation', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('rejects a response that violates its schema', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ id: 999 }),
    }) as typeof fetch;

    const client = createApiClient({
      baseURL: 'https://api.example.test',
      validationRate: 1,
    });

    await expect(
      client.fetch({
        url: '/items/1',
        method: 'get',
        responseSchema: {
          parse: (data: unknown) => {
            const row = data as { id: unknown };
            if (typeof row.id !== 'string') {
              throw new Error('Expected string at id');
            }
            return row as { id: string };
          },
        },
      }),
    ).rejects.toThrow('Expected string at id');
  });

  it('skips validation when validationRate is 0', async () => {
    const payload = { id: 1 };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => payload,
    }) as typeof fetch;

    const client = createApiClient({
      baseURL: 'https://api.example.test',
      validationRate: 0,
    });

    await expect(
      client.fetch({
        url: '/items/1',
        method: 'get',
        responseSchema: {
          parse: () => {
            throw new Error('should not run');
          },
        },
      }),
    ).resolves.toEqual(payload);
  });
});
