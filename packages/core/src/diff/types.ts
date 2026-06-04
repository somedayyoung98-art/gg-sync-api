export interface OpenApiDiffEntityDetail {
  location?: string;
  value?: unknown;
}

export interface OpenApiDiffDifference {
  type: 'breaking' | 'non-breaking' | 'unclassified';
  action: string;
  code: string;
  entity: string;
  source?: string;
  sourceSpecEntityDetails?: OpenApiDiffEntityDetail[];
  destinationSpecEntityDetails?: OpenApiDiffEntityDetail[];
}

export interface OpenApiDiffResult {
  breakingDifferencesFound: boolean;
  breakingDifferences?: OpenApiDiffDifference[];
  nonBreakingDifferences?: OpenApiDiffDifference[];
  unclassifiedDifferences?: OpenApiDiffDifference[];
}
