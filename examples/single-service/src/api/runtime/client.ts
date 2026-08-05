import { umiRequest } from '@somedayyoung/api-sync';

export { createApiClient, umiRequest } from '@somedayyoung/api-sync';

export function customFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  return umiRequest<T>(url, options);
}
