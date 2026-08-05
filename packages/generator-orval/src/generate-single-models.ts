import fs from 'node:fs/promises';
import path from 'node:path';
import { rollup, type OutputChunk } from 'rollup';
import dts from 'rollup-plugin-dts';
import type { PipelineContext } from '@somedayyoung/core';

export async function generateSingleModels(
  context: PipelineContext,
  file: string,
): Promise<void> {
  const parsedPath = path.parse(file);
  const modelsDir = path.join(
    context.outputDir,
    parsedPath.dir,
    parsedPath.name,
  );
  const bundle = await rollup({
    input: path.join(modelsDir, 'index.ts'),
    plugins: [dts()],
  });
  const { output } = await bundle.generate({ format: 'es' });
  await bundle.close();
  const [chunk] = output as OutputChunk[];

  await fs.writeFile(
    path.join(context.outputDir, file),
    chunk.code,
    'utf8',
  );
  await fs.rm(modelsDir, {
    recursive: true,
    force: true,
  });
}
