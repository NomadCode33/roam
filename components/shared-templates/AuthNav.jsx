'use client';

import { usePathname } from 'next/navigation';

export default function AuthNav() {
  const pathname = usePathname();

  const tagline = 
    pathname === '/signup' ? 'Join the map' : 
    'Welcome back';

  return (
    <nav className="auth-nav">
      <div className="auth-nav-logo">Roam</div>
      <div className="auth-nav-tagline">{tagline}</div>
    </nav>
  );
}