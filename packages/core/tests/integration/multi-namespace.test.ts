import '@gg-sync/generator-orval';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  filterServicesByNamespace,
  getBaselineSchemaPath,
  getNamespaceCacheDir,
  loadConfig,
  resolveAllServices,
  runPipeline,
} from '../../src/index.js';

const fixturesRoot = path.resolve(
  import.meta.dirname,
  '../../../../examples/multi-service/fixtures',
);

async function writeMultiServiceProject(dir: string): Promise<void> {
  await fs.mkdir(path.join(dir, 'fixtures'), { recursive: true });
  await fs.copyFile(
    path.join(fixturesRoot, 'user-openapi.json'),
    path.join(dir, 'fixtures/user-openapi.json'),
  );
  await fs.copyFile(
    path.join(fixturesRoot, 'billing-openapi.json'),
    path.join(dir, 'fixtures/billing-openapi.json'),
  );

  const config = `export default {
  services: {
    user: {
      input: { path: './fixtures/user-openapi.json' },
      output: { dir: './src/api/user/generated' },
      generators: ['typescript', 'sdk'],
    },
    billing: {
      input: { path: './fixtures/billing-openapi.json' },
      output: { dir: './src/api/billing/generated' },
      generators: ['typescript', 'sdk'],
    },
  },
};
`;
  await fs.writeFile(path.join(dir, 'api-sync.config.ts'), config, 'utf8');
}

describe('multi-namespace pipeline', () => {
  let tmp: string;

  afterEach(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it('syncs user and billing with isolated cache and output dirs', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-multi-'));
    await writeMultiServiceProject(tmp);

    const config = await loadConfig({
      cwd: tmp,
      configPath: path.join(tmp, 'api-sync.config.ts'),
    });
    const services = resolveAllServices(config);

    const result = await runPipeline({ cwd: tmp, services });
    expect(result.exitCode).toBe(0);
    expect(result.namespaces).toHaveLength(2);
    expect(result.namespaces.map((n) => n.namespace).sort()).toEqual([
      'billing',
      'user',
    ]);

    const userSdk = path.join(tmp, 'src/api/user/generated/sdk.ts');
    const billingSdk = path.join(tmp, 'src/api/billing/generated/sdk.ts');
    await expect(fs.stat(userSdk)).resolves.toBeDefined();
    await expect(fs.stat(billingSdk)).resolves.toBeDefined();

    const userCache = getBaselineSchemaPath(tmp, 'user');
    const billingCache = getBaselineSchemaPath(tmp, 'billing');
    await expect(fs.stat(userCache)).resolves.toBeDefined();
    await expect(fs.stat(billingCache)).resolves.toBeDefined();
    expect(userCache).not.toBe(billingCache);

    const userBaseline = JSON.parse(await fs.readFile(userCache, 'utf8'));
    const billingBaseline = JSON.parse(await fs.readFile(billingCache, 'utf8'));
    expect(userBaseline.info.title).toBe('User Service API');
    expect(billingBaseline.info.title).toBe('Billing Service API');
  });

  it('--namespace filter runs only the selected service', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-multi-'));
    await writeMultiServiceProject(tmp);

    const config = await loadConfig({
      cwd: tmp,
      configPath: path.join(tmp, 'api-sync.config.ts'),
    });
    const services = resolveAllServices(config);

    await runPipeline({ cwd: tmp, services });

    const billingCacheMtimeBefore = (
      await fs.stat(getBaselineSchemaPath(tmp, 'billing'))
    ).mtimeMs;

    const userOnly = filterServicesByNamespace(services, 'user');
    const partial = await runPipeline({
      cwd: tmp,
      services: userOnly,
      namespaceFilter: 'user',
    });
    expect(partial.namespaces).toHaveLength(1);
    expect(partial.namespaces[0]?.namespace).toBe('user');

    const billingCacheMtimeAfter = (
      await fs.stat(getBaselineSchemaPath(tmp, 'billing'))
    ).mtimeMs;
    expect(billingCacheMtimeAfter).toBe(billingCacheMtimeBefore);
  });

  it('throws with available namespaces when filter is unknown', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-multi-'));
    await writeMultiServiceProject(tmp);

    const config = await loadConfig({
      cwd: tmp,
      configPath: path.join(tmp, 'api-sync.config.ts'),
    });
    const services = resolveAllServices(config);

    expect(() => filterServicesByNamespace(services, 'missing')).toThrow(
      /Available namespaces:.*user.*billing/,
    );
  });

  it('aggregates exit code 1 when one namespace fails strict diff', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-multi-'));
    await writeMultiServiceProject(tmp);

    const config = await loadConfig({
      cwd: tmp,
      configPath: path.join(tmp, 'api-sync.config.ts'),
    });
    const services = resolveAllServices(config, true);

    await runPipeline({ cwd: tmp, services });

    const breakingBilling = JSON.parse(
      await fs.readFile(path.join(tmp, 'fixtures/billing-openapi.json'), 'utf8'),
    );
    delete breakingBilling.paths['/invoices/{id}'];
    await fs.writeFile(
      path.join(tmp, 'fixtures/billing-openapi.json'),
      JSON.stringify(breakingBilling, null, 2),
    );

    const result = await runPipeline({ cwd: tmp, services, mode: 'diff-only' });
    expect(result.exitCode).toBe(1);
    const billing = result.namespaces.find((n) => n.namespace === 'billing');
    const user = result.namespaces.find((n) => n.namespace === 'user');
    expect(billing?.exitCode).toBe(1);
    expect(user?.exitCode).toBe(0);

    const userCache = await fs.readFile(
      getBaselineSchemaPath(tmp, 'user'),
      'utf8',
    );
    expect(userCache).toContain('User Service API');
    await expect(fs.stat(getNamespaceCacheDir(tmp, 'billing'))).resolves.toBeDefined();
  });
});
