export type AIContext = {
  form?: unknown;
  standings?: unknown;
  statistics?: unknown;
  homeAway?: unknown;
  headToHead?: unknown;
  injuries?: unknown;
  suspensions?: unknown;
  lineups?: unknown;
  odds?: unknown;
  history?: unknown;
  match?: unknown;
  probabilities?: unknown;
  events?: unknown;
  [key: string]: unknown;
};

export type AIReportResult = {
  type: string;
  analysis: string;
  favorable: string[];
  unfavorable: string[];
  missingData?: string[];
  usedSources: string[];
  disclaimer: string;
  model?: string;
  provider?: string;
};

export interface AIProvider {
  readonly configured: boolean;
  analyzeMatch(context: AIContext): Promise<AIReportResult>;
}
