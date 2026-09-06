import { PageHero } from './page-hero';
import { EmptyState } from './empty-state';

export function ComingSoon({ sport }: { sport: string }) {
  return (
    <>
      <PageHero kicker="Modulo futuro" title={sport}>
        <p>
          L’architettura multi-sport è già predisposta. Nessun dato viene inventato in attesa del
          provider ufficiale.
        </p>
      </PageHero>
      <div className="card coming-panel">
        <EmptyState
          title={`${sport} in preparazione`}
          body="Quando la fonte sarà collegata, compariranno solo DATI verificati. STATISTICHE, PROBABILITÀ e ANALISI AI nasceranno da quelli."
        />
      </div>
    </>
  );
}
