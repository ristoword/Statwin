import { IosInstallNote } from '../../components/ios-install-note';
import { PageHero } from '../../components/page-hero';

export default function SettingsPage() {
  return (
    <>
      <PageHero kicker="Governance" title="Impostazioni">
        <p>Trasparenza, età e limiti del prodotto. STATWIN non accetta scommesse.</p>
      </PageHero>
      <IosInstallNote />
      <div className="card">
        <h3>Gioco responsabile</h3>
        <p>
          STATWIN è una piattaforma di analisi statistica. Non è un bookmaker e non accetta scommesse.
          Accesso riservato ai maggiorenni. Le probabilità sono stime.
        </p>
      </div>
    </>
  );
}
