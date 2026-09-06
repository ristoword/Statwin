import { PageHero } from '../../components/page-hero';
import { SportsGrid } from '../../components/sports-grid';

export default function SportsPage() {
  return (
    <>
      <PageHero kicker="Desk multi-sport" title="Tutti gli sport">
        <p className="disclaimer">
          18+. STATWIN analizza sport che hanno mercati di scommessa, ma non accetta giocate e non
          promette vincite. I punteggi esistono solo se una fonte ufficiale li ha chiusi.
        </p>
        <p>
          Calcio e basket possono avere dati sincronizzati. Gli altri desk sono predisposti: archivio
          vuoto, nessuna classifica inventata.
        </p>
      </PageHero>
      <SportsGrid />
    </>
  );
}
