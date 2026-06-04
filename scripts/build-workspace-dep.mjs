import { runInWorkspace } from './pm.mjs';

const [packageName, script] = process.argv.slice(2);

if (!packageName || !script) {
  console.error('Usage: node scripts/build-workspace-dep.mjs <packageName> <script>');
  process.exit(1);
}

runInWorkspace(packageName, script);
