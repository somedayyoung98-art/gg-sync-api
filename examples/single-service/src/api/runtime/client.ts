/**
 * Orval mutator：须在本地具名导出 `customFetch`（不可 `export { x } from` 再导出）。
 * 业务侧可再包一层 @gg-sync/runtime 的 createApiClient。
 */
export async function customFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export { createApiClient } from '@gg-sync/runtime';
