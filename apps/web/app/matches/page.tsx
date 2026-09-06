import { apiGet } from '../../lib/api';
import { asAgenda } from '../../lib/agenda';
import { SearchableAgenda } from '../../components/searchable-agenda';
import { PageHero } from '../../components/page-hero';

export default async function MatchesPage() {
  let payload: unknown = { recent: [], upcoming: [] };
  try {
    payload = await apiGet('/matches');
  } catch {
    payload = { recent: [], upcoming: [] };
  }
  const { recent, upcoming } = asAgenda(payload);

  return (
    <>
      <PageHero kicker="Calendario" title="Partite">
        <p>
          Ultime e prossime gare di tutti gli sport in archivio. I punteggi ufficiali sono DATI. Le
          stime restano PROBABILITÀ.
        </p>
      </PageHero>
      <SearchableAgenda recent={recent} upcoming={upcoming} />
    </>
  );
}
