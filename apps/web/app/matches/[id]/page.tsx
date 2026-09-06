import Link from 'next/link';
import { apiGet } from '../../../lib/api';
import { GenerateAiButton } from '../../../components/generate-ai-button';
import { MarketBoard } from '../../../components/market-board';
import { PredictedResult } from '../../../components/predicted-result';

type Layers = {
  disclaimer?: string;
  matchId?: string;
  data?: {
    homeTeam?: string;
    awayTeam?: string;
    competition?: string | null;
    kickoff?: string;
    status?: string;
    venue?: string | null;
    score?: { home: number; away: number } | null;
  };
  statistics?: {
    standings?: { home?: Standing; away?: Standing };
    form?: { home?: FormBlock; away?: FormBlock };
    headToHead?: { recent?: Array<{ home: string; away: string; score: string }> };
  } | null;
  probabilities?: {
    source?: string;
    items?: Array<{ selection: string; probability: number }>;
    outcomes?: Array<{ selection: string; probability: number }>;
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
    modelOutcomes?: Array<{ selection: string; probability: number; impliedOdds?: number | null }>;
  } | null;
  odds?: {
    disclaimer?: string;
    items?: Array<{ bookmaker?: string; market?: string; selection?: string; price?: number }>;
  } | null;
  aiAnalysis?: {
    content?: {
      analysis?: string;
      favorable?: string[];
      unfavorable?: string[];
      missingData?: string[];
      disclaimer?: string;
      predictedResult?: {
        outcome?: string;
        scoreHome?: number;
        scoreAway?: number;
        confidence?: string;
        rationale?: string | null;
      } | null;
    };
    createdAt?: string;
  } | null;
};

type Standing = {
  position?: number;
  points?: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
};

type FormBlock = {
  team?: string;
  last?: Array<{ opponent: string; score: string; result: string }>;
};

async function getLayers(id: string): Promise<Layers | null> {
  try {
    return await apiGet<Layers>(`/ai/matches/${id}`);
  } catch {
    return null;
  }
}

function pct(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

export default async function MatchAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const layers = await getLayers(id);
  const data = layers?.data;
  const stats = layers?.statistics;
  const probs = layers?.probabilities;
  const ai = layers?.aiAnalysis?.content;
  const outcomes = probs?.modelOutcomes ?? probs?.items ?? probs?.outcomes ?? [];
  const odds = layers?.odds?.items ?? [];

  return (
    <>
      <p className="kicker">{data?.competition ?? 'Partita'}</p>
      <h1>
        {data?.homeTeam ?? 'Casa'} <span className="muted">vs</span> {data?.awayTeam ?? 'Trasferta'}
      </h1>
      <p className="disclaimer">
        {layers?.disclaimer ??
          'Distinzione obbligatoria: DATI / STATISTICHE / PROBABILITÀ / ANALISI AI. 18+. Nessuna vincita promessa.'}
      </p>
      <p>
        <Link className="btn-ghost" href="/matches">
          Torna alle partite
        </Link>
      </p>

      <div className="hero broadcast">
        <span className="badge badge-data">DATI</span>
        <div className="scoreboard">
          <b>{data?.score?.home ?? '–'}</b>
          <span>:</span>
          <b>{data?.score?.away ?? '–'}</b>
        </div>
        <p>
          {data?.status} · {data?.kickoff ? new Date(data.kickoff).toLocaleString('it-IT') : 'orario n/d'}
          {data?.venue ? ` · ${data.venue}` : ''}
        </p>
        {!data?.score ? <p className="muted">Punteggio non presente in archivio: non viene inventato.</p> : null}
      </div>

      <div className="grid-2">
        <div className="card">
          <span className="badge badge-stats">STATISTICHE</span>
          <h3>Classifica e forma</h3>
          {stats ? (
            <>
              <p>Casa: {formatStanding(stats.standings?.home)}</p>
              <p>Trasferta: {formatStanding(stats.standings?.away)}</p>
              <FormLines block={stats.form?.home} label="Forma casa" />
              <FormLines block={stats.form?.away} label="Forma trasferta" />
              {stats.headToHead?.recent?.length ? (
                <p>
                  H2H:{' '}
                  {stats.headToHead.recent
                    .slice(0, 5)
                    .map((row) => `${row.home} ${row.score} ${row.away}`)
                    .join(' · ')}
                </p>
              ) : (
                <p className="muted">Nessuno scontro diretto concluso in archivio.</p>
              )}
            </>
          ) : (
            <p>Nessuna STATISTICA calcolabile dai DATI esistenti.</p>
          )}
        </div>

        <div className="card">
          <span className="badge badge-prob">PROBABILITÀ</span>
          <h3>Stime modellistiche</h3>
          {outcomes.length > 0 ? (
            outcomes.map((item) => (
              <div key={item.selection}>
                <strong>
                  {item.selection} · {pct(item.probability)}
                </strong>
                <div className="prob-bar">
                  <i style={{ width: `${Math.max(4, item.probability * 100)}%` }} />
                </div>
              </div>
            ))
          ) : (
            <p>Nessuna PROBABILITÀ in archivio e classifica insufficiente per stimarla.</p>
          )}
          <PredictedResult
            variant="prob"
            title="Risultato previsto · modello"
            home={data?.homeTeam}
            away={data?.awayTeam}
            prediction={probs?.predictedScore}
          />
          <MarketBoard
            outcomes={outcomes}
            overUnder={probs?.overUnder}
            btts={probs?.btts}
            disclaimer={probs?.impliedOddsDisclaimer}
          />
          <p className="disclaimer">Stime, non certezze. Non è un consiglio di scommessa.</p>
        </div>
      </div>

      <div className="card">
        <span className="badge badge-data">DATI</span>
        <h3>Quotazioni bookmaker</h3>
        {odds.length > 0 ? (
          <>
            <p className="muted">{layers?.odds?.disclaimer}</p>
            <div className="quote-grid">
              {odds.map((odd, index) => (
                <div className="quote-chip" key={`${odd.bookmaker}-${odd.selection}-${index}`}>
                  <span>{odd.bookmaker}</span>
                  <strong>
                    {odd.market} · {odd.selection}
                  </strong>
                  <em>{odd.price?.toFixed(2)}</em>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">
            Nessuna quota bookmaker in archivio. Le cifre sopra sono solo quote implicite del modello, non scommesse
            accettate.
          </p>
        )}
      </div>

      <div className="card">
        <span className="badge badge-ai">ANALISI AI</span>
        <h3>Lettura dei dati esistenti</h3>
        {ai?.analysis ? (
          <>
            <p>{ai.analysis}</p>
            {ai.favorable?.length ? (
              <>
                <h4>Fattori favorevoli</h4>
                <ul>
                  {ai.favorable.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {ai.unfavorable?.length ? (
              <>
                <h4>Fattori contrari</h4>
                <ul>
                  {ai.unfavorable.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {ai.missingData?.length ? (
              <p className="muted">Dati mancanti segnalati dall’AI: {ai.missingData.join(', ')}</p>
            ) : null}
            <PredictedResult
              variant="ai"
              title="Risultato previsto · AI"
              home={data?.homeTeam}
              away={data?.awayTeam}
              prediction={
                ai.predictedResult
                  ? {
                      home: ai.predictedResult.scoreHome,
                      away: ai.predictedResult.scoreAway,
                      outcome: ai.predictedResult.outcome,
                      confidence: ai.predictedResult.confidence,
                      rationale: ai.predictedResult.rationale,
                    }
                  : null
              }
            />
            <GenerateAiButton matchId={id} force label="Aggiorna analisi AI" />
          </>
        ) : (
          <>
            <p>Nessuna ANALISI AI salvata. Verrà usata solo la scheda già in archivio.</p>
            <GenerateAiButton matchId={id} />
          </>
        )}
      </div>
    </>
  );
}

function formatStanding(row?: Standing) {
  if (!row) return 'n/d';
  return `${row.position ?? '-'}° · ${row.points ?? 0} pt (${row.played ?? 0} gare)`;
}

function FormLines({ block, label }: { block?: FormBlock; label: string }) {
  if (!block?.last?.length) {
    return <p className="muted">{label}: non presente in archivio.</p>;
  }
  return (
    <div>
      <p className="muted">{label}</p>
      <div className="form-dots">
        {block.last.map((item, index) => (
          <span
            key={`${item.opponent}-${index}`}
            className={`form-dot ${item.result}`}
            title={`${item.result} ${item.score} vs ${item.opponent}`}
          >
            {item.result.slice(0, 1)}
          </span>
        ))}
      </div>
    </div>
  );
}
