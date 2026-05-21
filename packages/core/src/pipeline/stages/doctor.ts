import { access, constants, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  checkPeers,
  formatPeerCheckReport,
  type PeerCheckResult,
} from '../../doctor/check-peers.js';
import type { GeneratorId, ResolvedServiceConfig } from '../types.js';

export interface DoctorStageResult extends PeerCheckResult {
  outputDirIssues: string[];
}

function collectEnabledGenerators(
  services: ResolvedServiceConfig[],
): GeneratorId[] {
  const ids = new Set<GeneratorId>();
  for (const service of services) {
    for (const g of service.generators) ids.add(g);
  }
  return [...ids];
}

async function checkOutputDirsWritable(
  cwd: string,
  services: ResolvedServiceConfig[],
): Promise<string[]> {
  const issues: string[] = [];
  for (const service of services) {
    const dir = path.resolve(cwd, service.output.dir);
    try {
      await mkdir(dir, { recursive: true });
      await access(dir, constants.W_OK);
    } catch {
      issues.push(
        `Namespace "${service.namespace}": output directory not writable: ${dir}`,
      );
    }
  }
  return issues;
}

export async function runDoctorStage(
  cwd: string,
  services: ResolvedServiceConfig[],
): Promise<DoctorStageResult> {
  const generators = collectEnabledGenerators(services);
  const peerResult = await checkPeers(cwd, generators);
  const outputDirIssues = await checkOutputDirsWritable(cwd, services);

  return {
    ...peerResult,
    outputDirIssues,
    ok: peerResult.ok && outputDirIssues.length === 0,
  };
}

export function assertDoctorPassed(result: DoctorStageResult): void {
  if (result.ok) return;

  const parts: string[] = [];
  const peerReport = formatPeerCheckReport(result);
  if (peerReport) parts.push(peerReport);
  if (result.outputDirIssues.length > 0) {
    parts.push(...result.outputDirIssues.map((l) => `✖ ${l}`));
  }
  throw new Error(parts.join('\n'));
}
