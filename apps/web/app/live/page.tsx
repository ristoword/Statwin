import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { LIVE_FALLBACK, type LiveMatch, type LivePayload } from '../../lib/live';
import { EmptyState } from '../../components/empty-state';
import { OfficialWatchLinks } from '../../components/official-watch-links';
import { PageHero } from '../../components/page-hero';

async function load(): Promise<LivePayload> {
  try {
    return await apiGet<LivePayload>('/live');
  } catch {
    return LIVE_FALLBACK;
  }
}

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const payload = await load();
  const allLive = payload.live ?? [];
  const allUpcoming = payload.upcoming ?? [];
  const live = c ? allLive.filter((item) => item.competition.name === c) : allLive;
  const upcoming = c ? allUpcoming.filter((item) => item.competition.name === c) : allUpcoming;
  const groups = (payload.groups ?? []).filter((group) => !c || group.competition === c);
  const competitions = uniqueCompetitions(payload.groups ?? [], allLive, allUpcoming);
  const hasListings = live.length > 0 || upcoming.length > 0;
  const hasAnyOfficial = allLive.length > 0 || allUpcoming.length > 0;

  return (
    <>
      <PageHero kicker="Live · Diretta ufficiale" title="Dove guardare in modo legale">
        <p className="disclaimer">
          {payload.disclaimer ?? LIVE_FALLBACK.disclaimer}
        </p>
        <p className="muted">
          Solo siti ufficiali di lega e broadcaster autorizzati pubblicamente. STATWIN non è un
          broadcaster, non promette vincite e non elenca stream pirata. 18+.
        </p>
      </PageHero>

      <div className="grid">
        <div className="card stat">
          <span>In diretta ora</span>
          <strong>{live.length}</strong>
        </div>
        <div className="card stat">
          <span>Con elenco ufficiale</span>
          <strong>{upcoming.length + live.length}</strong>
        </div>
        <div className="card stat">
          <span>Senza elenco (omesse)</span>
          <strong>{payload.empty?.unlistedCount ?? 0}</strong>
        </div>
      </div>

      {competitions.length > 1 ? (
        <div className="card tabs">
          <Link href="/live" className={`chip ${!c ? 'chip-active' : 'chip-data'}`}>
            Tutte
          </Link>
          {competitions.map((item) => (
            <Link
              key={item}
              href={`/live?c=${encodeURIComponent(item)}`}
              className={`chip ${c === item ? 'chip-active' : 'chip-data'}`}
            >
              {item}
            </Link>
          ))}
        </div>
      ) : null}

      {!hasListings ? (
        <div className="card">
          <EmptyState
            title={
              c && hasAnyOfficial
                ? 'Nessuna gara in questo campionato'
                : payload.empty?.reason === 'no_official_listings'
                  ? 'Nessun elenco ufficiale'
                  : 'Nessuna diretta in elenco'
            }
            body={
              c && hasAnyOfficial
                ? 'Questo filtro non ha gare con destinazione ufficiale. Prova “Tutte”.'
                : payload.empty?.message ??
                  'Quando una gara ha una pagina legale (lega o broadcaster autorizzato), comparirà qui. I canali non ufficiali non vengono mai indicati.'
            }
          />
        </div>
      ) : (
        <>
          <h2>In corso</h2>
          {live.length === 0 ? (
            <div className="card">
              <EmptyState
                title="Nessuna gara live con elenco ufficiale"
                body="Se un incontro è in corso ma manca una fonte legale pubblica, non mostriamo un canale inventato."
              />
            </div>
          ) : (
            live.map((match) => <LiveMatchCard key={match.id} match={match} live />)
          )}

          <h2>Prossime con destinazione ufficiale</h2>
          {upcoming.length === 0 ? (
            <div className="card">
              <EmptyState
                title="Nessuna gara imminente in elenco"
                body="Il calendario ufficiale si aggiorna con la sincronizzazione. Senza pagina legale, la card non viene creata."
              />
            </div>
          ) : (
            groups
              .filter((group) => group.matches.some((item) => item.status === 'SCHEDULED'))
              .map((group) => (
                <section key={group.key} className="live-group">
                  <p className="kicker">
                    {group.country ? `${group.country} · ` : ''}
                    {group.competition}
                  </p>
                  {group.matches
                    .filter((item) => item.status === 'SCHEDULED')
                    .map((match) => (
                      <LiveMatchCard key={match.id} match={match} />
                    ))}
                </section>
              ))
          )}
        </>
      )}

      <div className="card">
        <h3>Cosa viene elencato</h3>
        <p>
          Pagine ufficiali di destinazione: siti di lega (Serie A, Premier League, UEFA, Bundesliga e altri
          campionati mappati) e home page di broadcaster autorizzati se il nome canale pubblico è ufficiale
          (es. DAZN, Sky). Mai aggregatori pirata, IPTV illegale o “free stream”.
        </p>
        <p className="muted">
          I match arrivano dal calendario già in archivio. Per aggiornare le gare usa la sincronizzazione
          calcio esistente; gli elenchi ufficiali sono calcolati, non inventati.
        </p>
      </div>
    </>
  );
}

function LiveMatchCard({ match, live = false }: { match: LiveMatch; live?: boolean }) {
  const official = match.score != null;
  return (
    <article className="match-card live-card">
      <div className="match-card-top">
        <span className={live ? 'badge badge-live' : 'badge badge-data'}>
          {live ? (
            <span className="pulse">
              <i />
              {match.status}
            </span>
          ) : (
            match.status
          )}
        </span>
        <span className="muted">
          {match.competition.name}
          {match.competition.country ? ` · ${match.competition.country}` : ''}
        </span>
      </div>
      <div className="match">
        <div className="match-team">{match.homeTeam.name}</div>
        <div className={`scoreboard${official ? '' : ' estimated'}`}>
          <b>{official ? match.score?.home : '–'}</b>
          <span>:</span>
          <b>{official ? match.score?.away : '–'}</b>
        </div>
        <div className="match-team right">{match.awayTeam.name}</div>
      </div>
      {!official ? <p className="muted estimate-line">Punteggio ufficiale assente: non viene inventato.</p> : null}
      <p className="muted">
        {new Date(match.kickoff).toLocaleString('it-IT')}
        {match.venue ? ` · ${match.venue}` : ''}
      </p>
      <OfficialWatchLinks listings={match.listings} />
      <p>
        <Link className="btn-ghost" href={`/matches/${match.id}`}>
          Scheda partita
        </Link>
      </p>
    </article>
  );
}

function uniqueCompetitions(
  groups: Array<{ competition: string }>,
  live: LiveMatch[],
  upcoming: LiveMatch[],
): string[] {
  const names = new Set<string>();
  for (const group of groups) names.add(group.competition);
  for (const match of [...live, ...upcoming]) names.add(match.competition.name);
  return [...names].sort((a, b) => a.localeCompare(b, 'it'));
}
