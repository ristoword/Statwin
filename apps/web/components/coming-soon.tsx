import { PageHero } from './page-hero';
import { EmptyState } from './empty-state';

export function ComingSoon({ sport }: { sport: string }) {
  return (
    <>
      <PageHero kicker="Modulo predisposto" title={sport}>
        <p className="disclaimer">
          18+. STATWIN e analisi, non un bookmaker. Nessun dato viene inventato in attesa del
          provider ufficiale.
        </p>
      </PageHero>
      <div className="card coming-panel">
        <EmptyState
          title={`${sport} in preparazione`}
          body="Quando la fonte sara collegata, compariranno solo DATI verificati. STATISTICHE, PROBABILITA e ANALISI AI nasceranno da quelli."
        />
      </div>
    </>
  );
}
