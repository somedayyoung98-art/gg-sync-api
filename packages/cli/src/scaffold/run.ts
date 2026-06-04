import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ScaffoldOptions {
  cwd?: string;
  /** Root API layout directory relative to cwd (default: src/api). */
  apiDir?: string;
  force?: boolean;
}

export interface ScaffoldFilePlan {
  relativePath: string;
  templateName: string;
}

export const SCAFFOLD_FILES: ScaffoldFilePlan[] = [
  { relativePath: 'runtime/client.ts', templateName: 'runtime/client.ts' },
  { relativePath: 'domain/index.ts', templateName: 'domain/index.ts' },
  { relativePath: 'generated/.gitignore', templateName: 'generated/.gitignore' },
  { relativePath: 'generated/README.md', templateName: 'generated/README.md' },
];

function templatesDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // Source: src/scaffold/run.ts → src/scaffold/templates
  // Bundled: dist/index.js → dist/scaffold/templates
  if (here.endsWith(`${path.sep}scaffold`) || here.endsWith('/scaffold')) {
    return path.join(here, 'templates');
  }
  return path.join(here, 'scaffold', 'templates');
}

async function readTemplate(templateName: string): Promise<string> {
  return fs.readFile(path.join(templatesDir(), templateName), 'utf8');
}

async function fileIsEmpty(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    if (stat.size === 0) return true;
    const content = await fs.readFile(filePath, 'utf8');
    return content.trim().length === 0;
  } catch {
    return false;
  }
}

async function shouldWrite(
  targetPath: string,
  force: boolean,
): Promise<'write' | 'skip-exists' | 'skip-non-empty'> {
  try {
    await fs.access(targetPath);
  } catch {
    return 'write';
  }

  if (!force) return 'skip-exists';
  if (await fileIsEmpty(targetPath)) return 'write';
  return 'skip-non-empty';
}

export async function runScaffold(
  options: ScaffoldOptions = {},
): Promise<{ exitCode: number; created: string[]; skipped: string[] }> {
  const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  const apiRoot = path.resolve(cwd, options.apiDir ?? 'src/api');
  const force = options.force ?? false;

  const created: string[] = [];
  const skipped: string[] = [];

  for (const file of SCAFFOLD_FILES) {
    const targetPath = path.join(apiRoot, file.relativePath);
    const decision = await shouldWrite(targetPath, force);

    if (decision === 'skip-exists') {
      skipped.push(file.relativePath);
      continue;
    }
    if (decision === 'skip-non-empty') {
      skipped.push(`${file.relativePath} (not empty)`);
      continue;
    }

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    const content = await readTemplate(file.templateName);
    await fs.writeFile(targetPath, content, 'utf8');
    created.push(file.relativePath);
  }

  return { exitCode: 0, created, skipped };
}
