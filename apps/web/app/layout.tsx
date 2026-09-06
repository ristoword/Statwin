import type { Metadata } from 'next';
import { Instrument_Serif, Manrope } from 'next/font/google';
import { SiteHeader } from '../components/site-header';
import { SiteFooter } from '../components/site-footer';
import './globals.css';

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'STATWIN — Sports Analytics AI',
  description: 'Piattaforma enterprise di analisi statistica sportiva. Le probabilità sono stime, non certezze.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className={`${sans.variable} ${serif.variable}`}>
        <div className="shell">
          <SiteHeader />
          <main className="page">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
