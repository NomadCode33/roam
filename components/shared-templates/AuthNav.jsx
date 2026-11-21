'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const TAGLINES = {
  '/login': 'Welcome back',
  '/signup': 'Join the map',
  '/forgot-password': 'Find your way',
  '/check-email': 'Almost there',
  '/reset-password': 'A fresh start',
  '/age-gate': 'Before you explore',
};

export default function AuthNav() {
  const pathname = usePathname();
  const tagline = Object.hasOwn(TAGLINES, pathname) ? TAGLINES[pathname] : '';

  return (
    <nav className="auth-nav">
      <Link href="/" className="auth-nav-logo">Roam</Link>
      {tagline && <div className="auth-nav-tagline">{tagline}</div>}
    </nav>
  );
}