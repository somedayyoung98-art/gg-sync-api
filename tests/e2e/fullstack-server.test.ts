import { type ChildProcess, execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const exampleDir = path.join(repoRoot, 'examples/single-service');
const cliDist = path.join(repoRoot, 'packages/cli/dist/index.js');
const TEST_PORT = 3120;
const SERVER_ORIGIN = `http://127.0.0.1:${TEST_PORT}`;
const OPENAPI_JSON_URL = `${SERVER_ORIGIN}/openapi.json`;

function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(url, (res) => {
          res.resume();
          if (res.statusCode === 200) resolve();
          else if (Date.now() > deadline) reject(new Error(`Unexpected status ${res.statusCode}`));
          else setTimeout(tick, 200);
        })
        .on('error', () => {
          if (Date.now() > deadline) reject(new Error(`Server not ready: ${url}`));
          else setTimeout(tick, 200);
        });
    };
    tick();
  });
}

function runSyncApiUrl(): void {
  execFileSync('pnpm', ['exec', 'sync-api', 'run', '--config', './api-sync.config.url.ts'], {
    cwd: exampleDir,
    stdio: 'pipe',
    env: { ...process.env, OPENAPI_URL: OPENAPI_JSON_URL },
    shell: process.platform === 'win32',
  });
}

describe('examples/single-service fullstack (Koa → URL → generate)', () => {
  let serverProc: ChildProcess | undefined;

  beforeAll(async () => {
    if (!fs.existsSync(cliDist)) {
      execFileSync('pnpm', ['build'], {
        cwd: repoRoot,
        stdio: 'inherit',
        shell: process.platform === 'win32',
      });
    }

    serverProc = spawn('pnpm', ['server'], {
      cwd: exampleDir,
      stdio: 'pipe',
      shell: process.platform === 'win32',
      env: { ...process.env, OPENAPI_PORT: String(TEST_PORT) },
    });

    await waitForServer(`${SERVER_ORIGIN}/health`);
  }, 60_000);

  afterAll(() => {
    serverProc?.kill('SIGTERM');
  });

  it('serves OpenAPI generated from Zod (not static hand-written doc)', async () => {
    const res = await fetch(OPENAPI_JSON_URL);
    expect(res.ok).toBe(true);
    const doc = (await res.json()) as {
      openapi?: string;
      paths?: Record<string, unknown>;
      components?: { schemas?: { User?: unknown } };
    };
    expect(doc.openapi).toBe('3.0.3');
    expect(doc.paths?.['/users/{id}']).toBeDefined();
    expect(doc.paths?.['/products']?.post).toBeDefined();
    expect(doc.components?.schemas?.User).toBeDefined();
    expect(doc.components?.schemas?.CreateProductRequest).toBeDefined();
  });

  it('pulls schema via input.url and generates TypeScript models + sdk', () => {
    runSyncApiUrl();

    const generated = path.join(exampleDir, 'src/api/generated');
    const userModel = path.join(generated, 'models/user.ts');
    expect(fs.existsSync(path.join(generated, 'sdk.ts'))).toBe(true);
    expect(fs.existsSync(userModel)).toBe(true);

    const source = fs.readFileSync(userModel, 'utf8');
    expect(source).toContain('export interface User');
    expect(source).toContain('firstName');

    const createProductModel = path.join(generated, 'models/createProductRequest.ts');
    expect(fs.existsSync(createProductModel)).toBe(true);
    expect(fs.readFileSync(createProductModel, 'utf8')).toContain('export interface CreateProductRequest');

    const sdk = fs.readFileSync(path.join(generated, 'sdk.ts'), 'utf8');
    expect(sdk).toContain('createProduct');

    expect(fs.existsSync(path.join(exampleDir, '.api-sync-cache/main/latest-schema.json'))).toBe(
      true,
    );
  });
});
