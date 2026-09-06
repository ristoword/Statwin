import Link from 'next/link';
import { BrandMark } from './brand-mark';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">
            <BrandMark size={28} id="sw-footer" />
            <strong className="serif">STATWIN</strong>
          </div>
          <p className="muted">Sports intelligence. Analisi, non scommesse. 18+.</p>
        </div>
        <div className="footer-cols">
          <Link href="/football">Calcio italiano</Link>
          <Link href="/statistics">Statistiche</Link>
          <Link href="/predictions">Probabilità</Link>
          <Link href="/ai-analysis">Analisi AI</Link>
        </div>
        <div className="footer-cols">
          <Link href="/subscriptions">Piani</Link>
          <Link href="/legal">Informative</Link>
          <Link href="/settings">Responsabilità</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </div>
      <div className="footer-inner footer-legal">
        Le probabilità sono stime modellistiche. Nessuna vincita promessa. Gioco responsabile.
      </div>
    </footer>
  );
}
