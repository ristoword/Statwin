import { PageHero } from '../../components/page-hero';

export default function LegalPage() {
  return (
    <>
      <PageHero kicker="Trasparenza" title="Informative">
        <p className="disclaimer">
          STATWIN è una piattaforma di analisi statistica. Non è un bookmaker. Non promette vincite.
          Le probabilità sono stime. Gioco responsabile. 18+.
        </p>
      </PageHero>
      <div className="card">
        <h3>I quattro livelli</h3>
        <p>
          DATI dal provider, STATISTICHE calcolate, PROBABILITÀ modellistiche, ANALISI AI come commento
          dei primi tre. L’AI non inventa risultati.
        </p>
      </div>
    </>
  );
}
