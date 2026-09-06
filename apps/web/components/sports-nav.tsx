'use client';

import Link from 'next/link';
import { useState } from 'react';
import { isSportPath, SPORT_CATALOG } from '../lib/sports-catalog';

export function SportsNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const active = isSportPath(pathname);

  return (
    <div className={`nav-sports${open ? ' open' : ''}${active ? ' active' : ''}`}>
      <button
        type="button"
        className="nav-sports-toggle"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        Sport
      </button>
      <div className="sports-menu" role="menu">
        {SPORT_CATALOG.map((sport) => (
          <Link
            key={sport.slug}
            href={sport.href}
            role="menuitem"
            className={pathname === sport.href || pathname.startsWith(`${sport.href}/`) ? 'active' : undefined}
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            <span>{sport.name}</span>
            <em>{sport.status === 'synced' ? 'DATI' : 'PREDISPOSTO'}</em>
          </Link>
        ))}
        <Link href="/sports" className="sports-menu-all" onClick={() => {
          setOpen(false);
          onNavigate?.();
        }}>
          Tutti i desk
        </Link>
      </div>
    </div>
  );
}
