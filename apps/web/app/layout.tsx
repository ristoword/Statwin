import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Manrope } from 'next/font/google';
import { PwaRegister } from '../components/pwa-register';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#030407',
};

export const metadata: Metadata = {
  title: 'STATWIN — Sports Analytics AI',
  description: 'Piattaforma enterprise di analisi statistica sportiva. Le probabilità sono stime, non certezze.',
  applicationName: 'STATWIN',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'STATWIN',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/logo.png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
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
        <PwaRegister />
      </body>
    </html>
  );
}
