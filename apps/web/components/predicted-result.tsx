const OUTCOMES: Record<string, string> = {
  HOME: '1 · Casa',
  DRAW: 'X · Pareggio',
  AWAY: '2 · Trasferta',
};

export type PredictedScoreView = {
  home?: number;
  away?: number;
  outcome?: string;
  homeXg?: number;
  awayXg?: number;
  scoreProbability?: number;
  confidence?: string;
  rationale?: string | null;
};

function pct(value?: number) {
  if (value == null || Number.isNaN(value)) return null;
  return `${Math.round(value * 1000) / 10}%`;
}

export function PredictedResult({
  variant,
  title,
  home,
  away,
  prediction,
}: {
  variant: 'prob' | 'ai';
  title: string;
  home?: string;
  away?: string;
  prediction?: PredictedScoreView | null;
}) {
  if (!prediction || prediction.home == null || prediction.away == null) {
    return (
      <div className={`predicted ${variant}`}>
        <span className={`badge ${variant === 'ai' ? 'badge-ai' : 'badge-prob'}`}>{title}</span>
        <p className="muted">Stima non disponibile: classifica o contesto insufficienti.</p>
      </div>
    );
  }

  const chance = pct(prediction.scoreProbability);
  return (
    <div className={`predicted ${variant}`}>
      <span className={`badge ${variant === 'ai' ? 'badge-ai' : 'badge-prob'}`}>{title}</span>
      <p className="muted predicted-sides">
        {home ?? 'Casa'} <span>vs</span> {away ?? 'Trasferta'}
      </p>
      <div className="scoreboard">
        <b>{prediction.home}</b>
        <span>:</span>
        <b>{prediction.away}</b>
      </div>
      <p>
        {OUTCOMES[prediction.outcome ?? ''] ?? prediction.outcome}
        {prediction.confidence ? ` · confidenza ${prediction.confidence}` : ''}
        {chance ? ` · ${chance} sul punteggio` : ''}
      </p>
      {prediction.homeXg != null && prediction.awayXg != null ? (
        <p className="muted">
          xG modello {prediction.homeXg.toFixed(2)} – {prediction.awayXg.toFixed(2)}
        </p>
      ) : null}
      {prediction.rationale ? <p>{prediction.rationale}</p> : null}
      <p className="disclaimer">Stima, non un risultato ufficiale. Non è un consiglio di scommessa.</p>
    </div>
  );
}
