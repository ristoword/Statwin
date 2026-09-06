import Link from 'next/link';
import { PageHero } from '../../components/page-hero';

export default function OfflinePage() {
  return (
    <>
      <PageHero kicker="Connessione" title="Sei offline">
        <p className="disclaimer">
          STATWIN non inventa punteggi né dirette. Senza rete restano solo le pagine già aperte in
          cache, se presenti.
        </p>
      </PageHero>
      <div className="card">
        <p>
          Riprova quando torni online. I DATI di partita arrivano solo dal provider, mai da una
          stima locale.
        </p>
        <p>
          <Link className="btn" href="/">
            Torna alla home
          </Link>
        </p>
      </div>
    </>
  );
}
