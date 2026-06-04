import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function removeDir(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function walkAndRemoveNodeModules(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') {
      await removeDir(path.join(dir, entry.name));
      continue;
    }
    if (!entry.isDirectory()) continue;
    if (entry.name === '.git') continue;
    await walkAndRemoveNodeModules(path.join(dir, entry.name));
  }
}

await removeDir(path.join(rootDir, 'node_modules'));
await walkAndRemoveNodeModules(rootDir);
console.log('Removed root node_modules and nested node_modules/dist folders.');
