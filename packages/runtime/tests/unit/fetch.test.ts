import { describe, expect, it } from 'vitest';
import { buildUrl } from '../../src/fetch';

describe('buildUrl', () => {
  it('builds an absolute URL with query parameters', () => {
    expect(
      buildUrl('/items', 'https://api.example.test', {
        page: 2,
        empty: null,
      }),
    ).toBe('https://api.example.test/items?page=2');
  });

  it('accepts an absolute path without a base URL', () => {
    expect(buildUrl('https://api.example.test/items')).toBe(
      'https://api.example.test/items',
    );
  });

  it('rejects a relative path without a base URL', () => {
    expect(() => buildUrl('/items')).toThrow(TypeError);
  });
});
