'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandMark } from './brand-mark';
import { InstallAppButton } from './install-app-button';
import { SportsNav } from './sports-nav';
import { clearTokens, getAccessToken } from '../lib/auth-storage';

const LINKS = [
  { href: '/football', label: 'Calcio' },
  { href: '/matches', label: 'Partite' },
  { href: '/live', label: 'Live' },
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
    try {
      setAuthed(Boolean(getAccessToken()));
    } catch {
      setAuthed(false);
    }
    setOpen(false);
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
          className={`nav-toggle${open ? ' open' : ''}`}
          type="button"
          aria-label={open ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav id="site-nav" className={`nav-links${open ? ' open' : ''}`}>
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
          <SportsNav pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>
        <div className={`header-cta${open ? ' open' : ''}`}>
          <InstallAppButton />
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
