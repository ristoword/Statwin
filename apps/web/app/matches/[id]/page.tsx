import Link from 'next/link';
import { apiGet } from '../../../lib/api';
import { GenerateAiButton } from '../../../components/generate-ai-button';

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
  } | null;
  aiAnalysis?: {
    content?: {
      analysis?: string;
      favorable?: string[];
      unfavorable?: string[];
      missingData?: string[];
      disclaimer?: string;
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
  const outcomes = probs?.items ?? probs?.outcomes ?? [];

  return (
    <div>
      <h1>
        {data?.homeTeam ?? 'Casa'} vs {data?.awayTeam ?? 'Trasferta'}
      </h1>
      <p className="disclaimer">
        {layers?.disclaimer ??
          'Distinzione obbligatoria: DATI / STATISTICHE / PROBABILITÀ / ANALISI AI. 18+. Nessuna vincita promessa.'}
      </p>
      <p>
        <Link href="/matches">Torna alle partite</Link>
      </p>

      <div className="card">
        <span className="badge">DATI</span>
        <h3>Scheda partita</h3>
        {data ? (
          <>
            <p>
              {data.competition ?? 'Competizione n/d'} · {data.status} ·{' '}
              {data.kickoff ? new Date(data.kickoff).toLocaleString('it-IT') : 'orario n/d'}
            </p>
            <p>
              Punteggio:{' '}
              {data.score ? `${data.score.home} - ${data.score.away}` : 'non presente in archivio (non inventato)'}
            </p>
            {data.venue ? <p>Impianto: {data.venue}</p> : null}
          </>
        ) : (
          <p>Nessun DATO in archivio per questa partita.</p>
        )}
      </div>

      <div className="card">
        <span className="badge">STATISTICHE</span>
        <h3>Classifica, forma, scontri diretti</h3>
        {stats ? (
          <>
            {stats.standings?.home || stats.standings?.away ? (
              <p>
                Casa: {formatStanding(stats.standings?.home)} · Trasferta: {formatStanding(stats.standings?.away)}
              </p>
            ) : (
              <p>Classifica non disponibile in archivio.</p>
            )}
            <FormLines block={stats.form?.home} label="Forma casa" />
            <FormLines block={stats.form?.away} label="Forma trasferta" />
            {stats.headToHead?.recent?.length ? (
              <p>
                H2H recente:{' '}
                {stats.headToHead.recent
                  .slice(0, 5)
                  .map((row) => `${row.home} ${row.score} ${row.away}`)
                  .join(' · ')}
              </p>
            ) : (
              <p>Nessuno scontro diretto concluso in archivio.</p>
            )}
          </>
        ) : (
          <p>Nessuna STATISTICA calcolabile dai DATI esistenti.</p>
        )}
      </div>

      <div className="card">
        <span className="badge">PROBABILITÀ</span>
        <h3>Stime modellistiche</h3>
        {outcomes.length > 0 ? (
          <ul>
            {outcomes.map((item) => (
              <li key={item.selection}>
                {item.selection}: {pct(item.probability)}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nessuna PROBABILITÀ in archivio e classifica insufficiente per stimarla.</p>
        )}
        <p className="disclaimer">Stime, non certezze. Non è un consiglio di scommessa.</p>
      </div>

      <div className="card">
        <span className="badge">ANALISI AI</span>
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
              <p>Dati mancanti segnalati dall’AI: {ai.missingData.join(', ')}</p>
            ) : null}
            <GenerateAiButton matchId={id} force label="Aggiorna analisi AI" />
          </>
        ) : (
          <>
            <p>Nessuna ANALISI AI salvata. Verrà usata solo la scheda già in archivio.</p>
            <GenerateAiButton matchId={id} />
          </>
        )}
      </div>
    </div>
  );
}

function formatStanding(row?: Standing) {
  if (!row) return 'n/d';
  return `${row.position ?? '-'}° · ${row.points ?? 0} pt (${row.played ?? 0} gare)`;
}

function FormLines({ block, label }: { block?: FormBlock; label: string }) {
  if (!block?.last?.length) {
    return <p>{label}: non presente in archivio.</p>;
  }
  return (
    <p>
      {label}: {block.last.map((item) => `${item.result} ${item.score} vs ${item.opponent}`).join(' · ')}
    </p>
  );
}
