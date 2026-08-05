import { extend } from 'umi-request';
import { shouldSampleValidation } from './sampling';
import type {
  CustomFetchConfig,
  CustomFetchOptions,
  Middleware,
} from './types';
import { validateResponse } from './validate';

export const umiRequest = extend({});

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
  options: CustomFetchOptions = {},
  middlewares: Middleware[] = [],
  validationRate = 1,
): Promise<T> {
  const run = async (): Promise<T> => {
    const { baseURL, headers, ...requestOptions } = options;
    const url = buildUrl(config.url, baseURL, config.params);
    const data = await umiRequest<T>(url, {
      ...requestOptions,
      method: config.method,
      headers: { ...config.headers, ...headers },
      data: config.data,
    });

    if (config.responseSchema && shouldSampleValidation(validationRate)) {
      return validateResponse(data, config.responseSchema);
    }

    return data;
  };

  let chain = run;
  for (const mw of [...middlewares].reverse()) {
    const next = chain;
    chain = () => mw(config, next) as Promise<T>;
  }
  return chain();
}
