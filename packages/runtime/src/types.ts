import type { RequestOptionsInit } from 'umi-request';

export type Middleware = (
  config: CustomFetchConfig<unknown>,
  next: () => Promise<unknown>,
) => Promise<unknown>;

export interface CustomFetchConfig<T> {
  url: string;
  method: string;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  responseSchema?: { parse: (data: unknown) => T };
}

export interface CustomFetchOptions extends RequestOptionsInit {
  baseURL?: string;
}

export interface ApiClient {
  fetch: <T>(config: CustomFetchConfig<T>) => Promise<T>;
}
