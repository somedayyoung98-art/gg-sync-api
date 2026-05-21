import type { ResolvedServiceConfig } from './types.js';

export function filterServicesByNamespace(
  services: ResolvedServiceConfig[],
  namespaceFilter?: string,
): ResolvedServiceConfig[] {
  if (!namespaceFilter) return services;

  const filtered = services.filter((s) => s.namespace === namespaceFilter);
  if (filtered.length === 0) {
    const available = services.map((s) => s.namespace).join(', ');
    throw new Error(
      `Unknown namespace "${namespaceFilter}". Available namespaces: ${available}`,
    );
  }
  return filtered;
}

export function listNamespaceIds(services: ResolvedServiceConfig[]): string[] {
  return services.map((s) => s.namespace);
}
