import { createHash } from 'node:crypto';

export function hashSchema(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
