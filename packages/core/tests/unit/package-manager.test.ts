import { afterEach, describe, expect, it } from 'vitest';
import {
  detectPackageManager,
  formatInstallHint,
} from '../../src/utils/package-manager';

const originalUa = process.env.npm_config_user_agent;

afterEach(() => {
  if (originalUa === undefined) delete process.env.npm_config_user_agent;
  else process.env.npm_config_user_agent = originalUa;
});

describe('package-manager hints', () => {
  it('detects pnpm from npm_config_user_agent primary token', () => {
    process.env.npm_config_user_agent = 'pnpm/9.0.0 npm/? node/v20';
    expect(detectPackageManager()).toBe('pnpm');
  });

  it('detects npm when npm is the primary token even if ua mentions pnpm', () => {
    process.env.npm_config_user_agent = 'npm/11.0.0 node/v22 pnpm/9.0.0';
    expect(detectPackageManager()).toBe('npm');
  });

  it('formats npm install hints when npm is active', () => {
    process.env.npm_config_user_agent = 'npm/11.0.0 node/v22';
    expect(formatInstallHint('@tanstack/react-query')).toBe(
      'npm install @tanstack/react-query',
    );
    expect(formatInstallHint('@gg-sync/plugin-msw', { dev: true })).toBe(
      'npm install -D @gg-sync/plugin-msw',
    );
  });

  it('formats pnpm add hints when pnpm is active', () => {
    process.env.npm_config_user_agent = 'pnpm/9.0.0';
    expect(formatInstallHint('msw', { version: '^2.0.0' })).toBe('pnpm add msw@^2.0.0');
  });
});
