import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = { title: 'STATWIN Admin' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <nav>
          <Link href="/" className="admin-brand">
            <img src="/logo.png" alt="" width={28} height={28} />
            STATWIN Admin
          </Link>
          <Link className="nav-core" href="/">Account</Link>
          <Link className="nav-core" href="/users">Utenti</Link>
          <Link className="nav-core" href="/audit">Accessi</Link>
          <Link className="nav-core" href="/subscriptions">Piani</Link>
          <Link className="nav-core" href="/payments">Pagamenti</Link>
          <span className="nav-sep" aria-hidden="true" />
          <Link className="nav-aux" href="/sports">Sport</Link>
          <Link className="nav-aux" href="/jobs">Jobs</Link>
          <Link className="nav-aux" href="/ai-reports">AI</Link>
          <Link className="nav-aux" href="/logs">Logs</Link>
          <Link href="/login">Login</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
