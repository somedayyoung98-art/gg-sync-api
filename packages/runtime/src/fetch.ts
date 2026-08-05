import type { CreateApiClientOptions } from './client';
import { shouldSampleValidation } from './sampling';
import type { CustomFetchConfig, Middleware } from './types';
import { validateResponse } from './validate';

export function buildUrl(
  path: string,
  baseURL?: string,
  params?: Record<string, unknown>,
): string {
  const url = new URL(path, baseURL);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v != null) url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export async function customFetch<T>(
  config: CustomFetchConfig<T>,
  options: CreateApiClientOptions = {},
  middlewares: Middleware[] = [],
  validationRate = 1,
): Promise<T> {
  const run = async (): Promise<T> => {
    const url = buildUrl(config.url, options.baseURL, config.params);
    const controller = new AbortController();
    const timeout = options.timeout ?? 10_000;
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        method: config.method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: config.data != null ? JSON.stringify(config.data) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as unknown;

      if (config.responseSchema && shouldSampleValidation(validationRate)) {
        return validateResponse(data, config.responseSchema);
      }

      return data as T;
    } finally {
      clearTimeout(timer);
    }
  };

  let chain = run;
  for (const mw of [...middlewares].reverse()) {
    const next = chain;
    chain = () => mw(config, next) as Promise<T>;
  }
  return chain();
}
