'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandMark } from './brand-mark';
import { clearTokens, getAccessToken } from '../lib/auth-storage';

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
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getAccessToken()));
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href={authed ? '/dashboard' : '/'} className="brand" onClick={() => setOpen(false)}>
          {authed ? <BrandMark id="sw-header" priority /> : null}
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
          {authed ? (
            <>
              <Link className="btn-ghost" href="/dashboard" onClick={() => setOpen(false)}>
                Desk
              </Link>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  clearTokens();
                  setAuthed(false);
                  setOpen(false);
                }}
              >
                Esci
              </button>
            </>
          ) : (
            <>
              <Link className="btn-ghost" href="/login" onClick={() => setOpen(false)}>
                Accedi
              </Link>
              <Link className="btn" href="/register" onClick={() => setOpen(false)}>
                Inizia
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
