import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fg from 'fast-glob';
import * as bundledPrettier from 'prettier';
import type { PipelineContext } from '../types';

type PrettierApi = Pick<
  typeof bundledPrettier,
  'resolveConfig' | 'format' | 'getFileInfo'
>;

async function loadPrettier(cwd: string): Promise<PrettierApi> {
  const require = createRequire(path.join(cwd, 'package.json'));
  let entry: string;
  try {
    entry = require.resolve('prettier');
  } catch {
    return bundledPrettier;
  }

  const loaded = (await import(pathToFileURL(entry).href)) as {
    default?: PrettierApi;
  } & Partial<PrettierApi>;
  return (loaded.default ?? loaded) as PrettierApi;
}

export async function runFormatStage(ctx: PipelineContext): Promise<PipelineContext> {
  const mode = ctx.config.output.format;
  if (mode === false) return ctx;

  const prettier = await loadPrettier(ctx.cwd);

  const files = await fg('**/*.{ts,tsx,mts,cts}', {
    cwd: ctx.outputDir,
    absolute: true,
  });
  const ignorePath = path.join(ctx.cwd, '.prettierignore');
  for (const filePath of files) {
    const info = await prettier.getFileInfo(filePath, { ignorePath });
    if (info.ignored) continue;

    const source = await fs.readFile(filePath, 'utf8');
    const config =
      (await prettier.resolveConfig(filePath, { editorconfig: true })) ?? {};
    const formatted = await prettier.format(source, {
      ...config,
      filepath: filePath,
    });
    await fs.writeFile(filePath, formatted, 'utf8');
  }

  return ctx;
}
