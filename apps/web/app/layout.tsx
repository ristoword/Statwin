import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'STATWIN — Sports Analytics AI',
  description: 'Analisi statistica sportiva. Le probabilità sono stime, non certezze.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <nav>
          <Link href="/">STATWIN</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/football">Calcio</Link>
          <Link href="/matches">Partite</Link>
          <Link href="/statistics">Statistiche</Link>
          <Link href="/predictions">Probabilità</Link>
          <Link href="/ai-analysis">Analisi AI</Link>
          <Link href="/subscriptions">Piani</Link>
          <Link href="/settings">Impostazioni</Link>
          <Link href="/login">Login</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
