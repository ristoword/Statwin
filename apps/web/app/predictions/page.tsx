import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { GenerateAiButton } from '../../components/generate-ai-button';

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
    <div>
      <span className="badge">PROBABILITÀ</span>
      <h1>Probabilità modellistiche</h1>
      <p className="disclaimer">
        {payload.disclaimer ??
          'Stime, non certezze. Il modello è sostituibile senza cambiare il resto dell’app. 18+. Nessuna vincita promessa.'}
      </p>
      {items.length === 0 ? (
        <div className="card">Nessuna partita in archivio su cui calcolare probabilità.</div>
      ) : (
        items.map((item) => {
          const outcomes = item.probabilities?.items ?? item.probabilities?.outcomes ?? [];
          return (
            <div className="card" key={item.matchId}>
              <span className="badge">PROBABILITÀ</span>
              <h3>
                <Link href={`/matches/${item.matchId}`}>
                  {item.home} vs {item.away}
                </Link>
              </h3>
              <p>
                {item.competition ?? 'Calcio'} · {new Date(item.kickoff).toLocaleString('it-IT')}
              </p>
              {outcomes.length > 0 ? (
                <ul>
                  {outcomes.map((row) => (
                    <li key={row.selection}>
                      {row.selection}: {pct(row.probability)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Probabilità non calcolabile: classifica o storico insufficienti.</p>
              )}
              {item.aiCommentary?.excerpt ? (
                <>
                  <span className="badge">ANALISI AI</span>
                  <p>{item.aiCommentary.excerpt}</p>
                </>
              ) : (
                <GenerateAiButton matchId={item.matchId} label="Aggiungi commento AI" />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
