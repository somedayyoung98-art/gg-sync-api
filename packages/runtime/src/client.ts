import { customFetch } from './fetch.js';
import type { ApiClient, CustomFetchConfig, Middleware } from './types.js';

export interface CreateApiClientOptions {
  baseURL?: string;
  timeout?: number;
  /** Fraction of responses to validate at runtime (0–1). Default 1. */
  validationRate?: number;
}

export function createApiClient(options: CreateApiClientOptions = {}): ApiClient & {
  use: (mw: Middleware) => void;
} {
  const middlewares: Middleware[] = [];
  const validationRate = options.validationRate ?? 1;

  const client = {
    use(mw: Middleware) {
      middlewares.push(mw);
    },
    fetch: <T>(config: CustomFetchConfig<T>) =>
      customFetch(config, options, middlewares, validationRate),
  };

  return client;
}
