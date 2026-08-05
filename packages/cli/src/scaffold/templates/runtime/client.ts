export { createApiClient } from '@somedayyoung/runtime';
export type { ApiClient, CustomFetchConfig, Middleware } from '@somedayyoung/runtime';

/** Orval requires a locally declared mutator rather than a package re-export. */
export async function customFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
