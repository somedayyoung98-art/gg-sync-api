import fs from 'node:fs/promises';
import path from 'node:path';

const source = `import { customFetch as request } from '@somedayyoung/api-sync';
import type { CustomFetchConfig, CustomFetchOptions } from '@somedayyoung/api-sync';

export function customFetch<T>(
  config: CustomFetchConfig<T>,
  options?: CustomFetchOptions,
): Promise<T> {
  return request(config, options);
}
`;

export async function writeSdkRequest(outputDir: string): Promise<void> {
  await fs.writeFile(path.join(outputDir, 'sdk-request.ts'), source, 'utf8');
}
