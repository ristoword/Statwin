import { PageHero } from '../../components/page-hero';
import { SportsDirectory } from '../../components/sports-directory';

export default function SportsPage() {
  return (
    <>
      <PageHero kicker="Desk multi-sport" title="Tutti gli sport">
        <p className="disclaimer">
          18+. STATWIN analizza sport che hanno mercati di scommessa, ma non accetta giocate e non
          promette vincite. I punteggi esistono solo se una fonte ufficiale li ha chiusi.
        </p>
        <p>
          Ogni desk sincronizzato ha calendari (ultime/prossime), classifiche se la fonte le ha, e
          le quattro layer DATI / STATISTICHE / PROBABILITÀ / ANALISI AI. L’ippica resta vuota:
          nessun feed pubblico legale. L’AI non scrive senza DATI.
        </p>
      </PageHero>
      <SportsDirectory />
    </>
  );
}
