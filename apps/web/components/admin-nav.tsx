'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Account', exact: true },
  { href: '/admin/users', label: 'Utenti' },
  { href: '/admin/audit', label: 'Accessi' },
  { href: '/admin/subscriptions', label: 'Piani' },
  { href: '/admin/payments', label: 'Pagamenti' },
  { href: '/admin/sports', label: 'Sport' },
  { href: '/admin/jobs', label: 'Jobs' },
  { href: '/admin/ai-reports', label: 'AI' },
  { href: '/admin/logs', label: 'Logs' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Control room">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link key={link.href} href={link.href} className={active ? 'active' : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
