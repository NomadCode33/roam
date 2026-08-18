import Link from 'next/link';

export default function Nav() {
  return (
    <>
      {/* NAV */}
      <nav className="site-nav">
        <Link href="/" className="site-nav-logo">Roam</Link>
        <div className="site-nav-actions">
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/signup" className="btn-solid">Sign up</Link>
        </div>
      </nav>
    </>
  );
}