import type { DiffReport } from '../pipeline/types.js';

export function formatDiffReport(report: DiffReport): string {
  const lines: string[] = [report.summary];

  if (report.breaking.length > 0) {
    lines.push('', 'Breaking changes:');
    for (const item of report.breaking) {
      lines.push(`  • [${item.code}] ${item.path}`);
      if (item.message) lines.push(`    ${item.message}`);
    }
  }

  if (report.nonBreaking.length > 0) {
    lines.push('', 'Non-breaking changes:');
    for (const item of report.nonBreaking) {
      lines.push(`  • [${item.code}] ${item.path}`);
      if (item.message) lines.push(`    ${item.message}`);
    }
  }

  return lines.join('\n');
}
