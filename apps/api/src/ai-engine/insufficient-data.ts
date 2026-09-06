export const INSUFFICIENT_AI_ANALYSIS =
  'Dati insufficienti. L’AI legge solo DATI, STATISTICHE e PROBABILITÀ già in archivio. Senza quella scheda non scrive e non inventa punteggi.';

export const INSUFFICIENT_AI_DISCLAIMER =
  'ANALISI AI: nessun risultato ufficiale. 18+. Nessuna vincita promessa. STATWIN non è un bookmaker.';

export type InsufficientAiResponse = {
  layer: 'AI_ANALYSIS';
  reused: false;
  insufficient: true;
  sport: string | null;
  eventId: string | null;
  matchId: null;
  report: {
    type: 'insufficient-data';
    content: {
      analysis: string;
      favorable: [];
      unfavorable: [];
      missingData: string[];
      predictedResult: null;
      disclaimer: string;
      model: null;
      provider: 'statwin';
    };
    sources: [];
  };
};

export function insufficientAiResponse(options?: {
  sport?: string;
  eventId?: string;
  missing?: string[];
}): InsufficientAiResponse {
  return {
    layer: 'AI_ANALYSIS',
    reused: false,
    insufficient: true,
    sport: options?.sport ?? null,
    eventId: options?.eventId ?? null,
    matchId: null,
    report: {
      type: 'insufficient-data',
      content: {
        analysis: INSUFFICIENT_AI_ANALYSIS,
        favorable: [],
        unfavorable: [],
        missingData: options?.missing?.length
          ? options.missing
          : ['DATI', 'STATISTICHE', 'PROBABILITÀ'],
        predictedResult: null,
        disclaimer: INSUFFICIENT_AI_DISCLAIMER,
        model: null,
        provider: 'statwin',
      },
      sources: [],
    },
  };
}

export function hasArchiveContext(context: Record<string, unknown>): boolean {
  return Object.entries(context).some(([key, value]) => {
    if (key === 'sport' || key === 'eventId' || key === 'matchId') return false;
    return value !== undefined && value !== null && !isEmptyValue(value);
  });
}

function isEmptyValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (value && typeof value === 'object') return Object.keys(value).length === 0;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
}
