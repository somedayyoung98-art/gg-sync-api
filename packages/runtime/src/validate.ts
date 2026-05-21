export interface ValidationContext {
  method: string;
  url: string;
}

export interface ResponseSchema<T> {
  parse: (data: unknown) => T;
}

export interface ValidationIssueDetail {
  path: string;
  message: string;
  expected?: string;
  received?: string;
}

function formatIssuePath(path: Array<string | number>): string {
  if (path.length === 0) return '(root)';
  return path.map((p) => (typeof p === 'number' ? `[${p}]` : p)).join('.');
}

function extractIssues(error: unknown): ValidationIssueDetail[] {
  if (
    error &&
    typeof error === 'object' &&
    'issues' in error &&
    Array.isArray((error as { issues: unknown }).issues)
  ) {
    return (error as { issues: Array<Record<string, unknown>> }).issues.map(
      (issue) => ({
        path: formatIssuePath((issue.path as Array<string | number>) ?? []),
        message: String(issue.message ?? 'validation failed'),
        expected: issue.expected != null ? String(issue.expected) : undefined,
        received: issue.received != null ? String(issue.received) : undefined,
      }),
    );
  }

  return [
    {
      path: '(root)',
      message: error instanceof Error ? error.message : String(error),
    },
  ];
}

/**
 * Log-only validation: warn on mismatch, always return original payload (FR-017).
 */
export function validateResponse<T>(
  data: unknown,
  schema: ResponseSchema<T>,
  ctx: ValidationContext,
): T {
  try {
    return schema.parse(data);
  } catch (err) {
    const issues = extractIssues(err);
    console.warn('[Runtime Contract Violation]', {
      endpoint: `${ctx.method.toUpperCase()} ${ctx.url}`,
      issues,
    });
    return data as T;
  }
}
