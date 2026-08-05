import { describe, expect, it } from 'vitest';
import { validateResponse } from '../../src/validate';

describe('validateResponse', () => {
  it('returns the schema result', () => {
    const result = validateResponse('42', {
      parse: (data) => Number(data),
    });

    expect(result).toBe(42);
  });

  it('exposes schema errors', () => {
    const error = new Error('Expected string at id');

    expect(() =>
      validateResponse({ id: 1 }, {
        parse: () => {
          throw error;
        },
      }),
    ).toThrow(error);
  });
});
