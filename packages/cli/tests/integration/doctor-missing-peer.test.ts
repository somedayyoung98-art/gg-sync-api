import '@gg-sync/plugin-react-query';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import '@gg-sync/generator-orval';
import { doctorCommand } from '../../src/commands/doctor.js';
import { runCommand } from '../../src/commands/run.js';

async function writeReactQueryProject(dir: string): Promise<void> {
  await fs.writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'doctor-test', private: true, type: 'module' }, null, 2),
    'utf8',
  );

  const config = `export default {
  services: {
    main: {
      input: { path: './openapi.json' },
      output: { dir: './src/api/generated' },
      generators: ['typescript', 'sdk', 'react-query'],
    },
  },
};
`;
  await fs.writeFile(path.join(dir, 'api-sync.config.ts'), config, 'utf8');
  await fs.writeFile(
    path.join(dir, 'openapi.json'),
    JSON.stringify(
      {
        openapi: '3.0.3',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      },
      null,
      2,
    ),
    'utf8',
  );
}

describe('doctor missing peer', () => {
  let tmp: string;

  afterEach(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it('doctor exits 1 when react-query enabled but @tanstack/react-query is missing', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-doctor-'));
    await writeReactQueryProject(tmp);

    const code = await doctorCommand({ cwd: tmp });
    expect(code).toBe(1);
    // Plugin package is loaded in monorepo tests; peer must be reported
  });

  it('run aborts before pull when doctor fails', async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'api-sync-doctor-'));
    await writeReactQueryProject(tmp);

    const code = await runCommand({ cwd: tmp });
    expect(code).toBe(1);
  });
});
