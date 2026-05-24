import fs from 'node:fs/promises';
import path from 'node:path';

const ORVAL_HEADER_RE = /^\/\*\*[\s\S]*?\*\/\s*/;
const LOCAL_TYPE_IMPORT_RE =
  /^import\s+type\s+\{[^}]+\}\s+from\s+['"]\.\/([^'"]+)['"];\s*\n?/gm;

function moduleNameFromFile(file: string): string {
  return file.replace(/\.ts$/, '');
}

function localImports(content: string): string[] {
  const deps: string[] = [];
  for (const match of content.matchAll(LOCAL_TYPE_IMPORT_RE)) {
    if (match[1]) deps.push(match[1]);
  }
  return deps;
}

function stripLocalImports(content: string, localModules: Set<string>): string {
  return content.replace(LOCAL_TYPE_IMPORT_RE, (line, mod) =>
    localModules.has(mod) ? '' : line,
  );
}

function sortByLocalDeps(files: string[], bodies: Map<string, string>): string[] {
  const names = new Set(files.map(moduleNameFromFile));
  const remaining = new Set(files);
  const sorted: string[] = [];

  while (remaining.size > 0) {
    const ready = [...remaining].filter((file) => {
      const deps = localImports(bodies.get(file) ?? '');
      return deps.every((dep) => !names.has(dep) || !remaining.has(`${dep}.ts`));
    });

    if (ready.length === 0) {
      return [...sorted, ...[...remaining].sort()];
    }

    ready.sort();
    for (const file of ready) {
      sorted.push(file);
      remaining.delete(file);
    }
  }

  return sorted;
}

/**
 * Merge Orval `models/*.ts` into one `models.ts` next to `sdk.ts`.
 */
export async function consolidateModelsToSingleFile(outputDir: string): Promise<void> {
  const modelsDir = path.join(outputDir, 'models');
  const targetFile = path.join(outputDir, 'models.ts');

  let entries: string[];
  try {
    entries = await fs.readdir(modelsDir);
  } catch {
    return;
  }

  const files = entries.filter((f) => f.endsWith('.ts') && f !== 'index.ts').sort();
  if (files.length === 0) return;

  const localModules = new Set(files.map(moduleNameFromFile));
  let header = '';
  const bodies = new Map<string, string>();

  for (const file of files) {
    let content = await fs.readFile(path.join(modelsDir, file), 'utf8');
    const match = content.match(ORVAL_HEADER_RE);
    if (match) {
      if (!header) header = match[0];
      content = content.slice(match[0].length);
    }
    bodies.set(file, stripLocalImports(content.trim(), localModules));
  }

  const ordered = sortByLocalDeps(files, bodies);
  const merged = ordered.map((f) => bodies.get(f)).filter(Boolean).join('\n\n');

  await fs.writeFile(targetFile, `${header}${merged}\n`, 'utf8');
  await fs.rm(modelsDir, { recursive: true, force: true });
}
