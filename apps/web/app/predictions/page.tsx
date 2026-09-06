import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { EmptyState } from '../../components/empty-state';
import { GenerateAiButton } from '../../components/generate-ai-button';
import { PageHero } from '../../components/page-hero';

type PredictionList = {
  disclaimer?: string;
  items?: Array<{
    matchId: string;
    home: string;
    away: string;
    kickoff: string;
    competition?: string | null;
    probabilities?: {
      items?: Array<{ selection: string; probability: number }>;
      outcomes?: Array<{ selection: string; probability: number }>;
    } | null;
    aiCommentary?: { excerpt?: string | null } | null;
  }>;
};

function pct(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

export default async function PredictionsPage() {
  let payload: PredictionList = {};
  try {
    payload = await apiGet<PredictionList>('/predictions');
  } catch {
    payload = { items: [] };
  }
  const items = payload.items ?? [];

  return (
    <>
      <PageHero kicker="Modelli" title="Probabilità">
        <p className="disclaimer">
          {payload.disclaimer ??
            'Stime, non certezze. Il modello è sostituibile. 18+. Nessuna vincita promessa.'}
        </p>
      </PageHero>
      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Nessuna stima disponibile"
            body="Senza partite e classifiche in archivio il modello non produce probabilità."
          />
        </div>
      ) : (
        items.map((item) => {
          const outcomes = item.probabilities?.items ?? item.probabilities?.outcomes ?? [];
          return (
            <div className="card" key={item.matchId}>
              <span className="badge badge-prob">PROBABILITÀ</span>
              <h3>
                <Link href={`/matches/${item.matchId}`}>
                  {item.home} vs {item.away}
                </Link>
              </h3>
              <p className="muted">
                {item.competition ?? 'Calcio'} · {new Date(item.kickoff).toLocaleString('it-IT')}
              </p>
              {outcomes.length > 0 ? (
                outcomes.map((row) => (
                  <div key={row.selection}>
                    <strong>
                      {row.selection} · {pct(row.probability)}
                    </strong>
                    <div className="prob-bar">
                      <i style={{ width: `${Math.max(4, row.probability * 100)}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <p>Probabilità non calcolabile: classifica o storico insufficienti.</p>
              )}
              {item.aiCommentary?.excerpt ? (
                <>
                  <span className="badge badge-ai">ANALISI AI</span>
                  <p>{item.aiCommentary.excerpt}</p>
                </>
              ) : (
                <GenerateAiButton matchId={item.matchId} label="Aggiungi commento AI" />
              )}
            </div>
          );
        })
      )}
    </>
  );
}
