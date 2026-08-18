'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AuthNav() {
  const pathname = usePathname();

  const tagline = 
    pathname === '/signup' ? 'Join the map' : 
    'Welcome back';

  return (
    <nav className="auth-nav">
      <Link href="/" className="auth-nav-logo">Roam</Link>
      <div className="auth-nav-tagline">{tagline}</div>
    </nav>
  );
}