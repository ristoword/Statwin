import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { EmptyState } from '../../components/empty-state';
import { GenerateAiButton } from '../../components/generate-ai-button';
import { MarketBoard } from '../../components/market-board';
import { PageHero } from '../../components/page-hero';
import { PredictedResult } from '../../components/predicted-result';

type PredictionItem = {
  matchId: string;
  home: string;
  away: string;
  kickoff: string;
  competition?: string | null;
  probabilities?: {
    items?: Array<{ selection: string; probability: number; impliedOdds?: number | null }>;
    outcomes?: Array<{ selection: string; probability: number; impliedOdds?: number | null }>;
    predictedScore?: {
      home?: number;
      away?: number;
      outcome?: string;
      homeXg?: number;
      awayXg?: number;
      scoreProbability?: number;
    } | null;
    overUnder?: Array<{
      line: number;
      over: number;
      under: number;
      impliedOver?: number | null;
      impliedUnder?: number | null;
    }> | null;
    btts?: { yes: number; no: number; impliedYes?: number | null; impliedNo?: number | null } | null;
    impliedOddsDisclaimer?: string | null;
  } | null;
  aiCommentary?: {
    excerpt?: string | null;
    predictedResult?: {
      outcome?: string;
      scoreHome?: number;
      scoreAway?: number;
      confidence?: string;
      rationale?: string | null;
    } | null;
  } | null;
};

type PredictionList = {
  disclaimer?: string;
  items?: PredictionItem[];
  recent?: PredictionItem[];
  upcoming?: PredictionItem[];
};

export default async function PredictionsPage() {
  let payload: PredictionList = {};
  try {
    payload = await apiGet<PredictionList>('/predictions');
  } catch {
    payload = { items: [] };
  }
  const now = Date.now();
  const upcoming = payload.upcoming ?? (payload.items ?? []).filter((item) => new Date(item.kickoff).getTime() >= now);
  const recent = payload.recent ?? (payload.items ?? []).filter((item) => new Date(item.kickoff).getTime() < now);

  return (
    <>
      <PageHero kicker="Modelli" title="Probabilità">
        <p className="disclaimer">
          {payload.disclaimer ??
            'Stime, non certezze. 1X2, Over/Under e quote implicite del modello. Mai un DATO ufficiale. 18+.'}
        </p>
      </PageHero>
      {upcoming.length === 0 && recent.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Nessuna stima disponibile"
            body="Senza partite e classifiche in archivio il modello non produce probabilità."
          />
        </div>
      ) : (
        <>
          <h2>Prossime partite</h2>
          {upcoming.length === 0 ? (
            <div className="card">
              <EmptyState title="Nessuna gara futura" body="Quando arriva il calendario, le stime Over e 1X2 compariranno qui." />
            </div>
          ) : (
            upcoming.map((item) => <PredictionCard key={item.matchId} item={item} />)
          )}
          <h2>Ultime partite</h2>
          {recent.length === 0 ? (
            <div className="card">
              <EmptyState title="Nessuna gara recente" body="Le stime ex-ante restano visibili dopo il fischio finale, distinte dal risultato ufficiale." />
            </div>
          ) : (
            recent.map((item) => <PredictionCard key={item.matchId} item={item} />)
          )}
        </>
      )}
    </>
  );
}

function PredictionCard({ item }: { item: PredictionItem }) {
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
      <PredictedResult
        variant="prob"
        title="Risultato previsto · modello"
        home={item.home}
        away={item.away}
        prediction={item.probabilities?.predictedScore}
      />
      <MarketBoard
        outcomes={outcomes}
        overUnder={item.probabilities?.overUnder}
        btts={item.probabilities?.btts}
        disclaimer={item.probabilities?.impliedOddsDisclaimer}
      />
      {item.aiCommentary?.excerpt ? (
        <>
          <span className="badge badge-ai">ANALISI AI</span>
          <p>{item.aiCommentary.excerpt}</p>
          <PredictedResult
            variant="ai"
            title="Risultato previsto · AI"
            home={item.home}
            away={item.away}
            prediction={
              item.aiCommentary.predictedResult
                ? {
                    home: item.aiCommentary.predictedResult.scoreHome,
                    away: item.aiCommentary.predictedResult.scoreAway,
                    outcome: item.aiCommentary.predictedResult.outcome,
                    confidence: item.aiCommentary.predictedResult.confidence,
                    rationale: item.aiCommentary.predictedResult.rationale,
                  }
                : null
            }
          />
        </>
      ) : (
        <GenerateAiButton matchId={item.matchId} label="Aggiungi commento AI" />
      )}
    </div>
  );
}
