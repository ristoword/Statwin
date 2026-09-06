import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = { title: 'STATWIN Admin' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <nav>
          <Link href="/">STATWIN Admin</Link>
          <Link href="/">Overview</Link>
          <Link href="/users">Utenti</Link>
          <Link href="/subscriptions">Abbonamenti</Link>
          <Link href="/payments">Pagamenti</Link>
          <Link href="/sports">Sport</Link>
          <Link href="/providers">Provider</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/ai-reports">AI reports</Link>
          <Link href="/logs">Logs</Link>
          <Link href="/login">Login</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
