'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BrandMark } from './brand-mark';

const LINKS = [
  { href: '/football', label: 'Calcio' },
  { href: '/matches', label: 'Partite' },
  { href: '/statistics', label: 'Statistiche' },
  { href: '/predictions', label: 'Probabilità' },
  { href: '/ai-analysis', label: 'Analisi AI' },
  { href: '/subscriptions', label: 'Piani' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <BrandMark id="sw-header" priority />
          <span className="brand-name">
            STAT<span>WIN</span>
          </span>
        </Link>
        <button
          className="nav-toggle"
          type="button"
          aria-label="Apri menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? '✕' : '☰'}
        </button>
        <nav className={`nav-links${open ? ' open' : ''}`}>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname.startsWith(link.href) ? 'active' : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={`header-cta${open ? ' open' : ''}`}>
          <Link className="btn-ghost" href="/login" onClick={() => setOpen(false)}>
            Accedi
          </Link>
          <Link className="btn" href="/register" onClick={() => setOpen(false)}>
            Inizia
          </Link>
        </div>
      </div>
    </header>
  );
}
