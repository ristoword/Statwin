import { AccountForm } from '../../components/account-form';
import { IosInstallNote } from '../../components/ios-install-note';
import { PageHero } from '../../components/page-hero';

export default function SettingsPage() {
  return (
    <>
      <PageHero kicker="Account" title="Impostazioni">
        <p>Email, telefono e password del tuo desk. Trasparenza, età e limiti del prodotto. 18+.</p>
      </PageHero>
      <IosInstallNote />
      <div className="card" id="account">
        <p className="kicker">Account</p>
        <h2>Il tuo profilo</h2>
        <p className="disclaimer">
          STATWIN è analisi statistica, non un bookmaker. Le probabilità sono stime, non certezze.
        </p>
        <AccountForm />
      </div>
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
