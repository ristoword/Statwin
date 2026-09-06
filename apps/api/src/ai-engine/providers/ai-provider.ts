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
};

export type AIReportResult = {
  type: string;
  analysis: string;
  favorable: string[];
  unfavorable: string[];
  usedSources: string[];
  disclaimer: string;
};

export interface AIProvider {
  analyzeMatch(context: AIContext): Promise<AIReportResult>;
}
