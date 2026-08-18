import Link from 'next/link';

export default function Nav() {
  return (
    <>
      {/* NAV */}
      <nav className="site-nav">
        <div className="site-nav-logo">Roam</div>
        <div className="site-nav-actions">
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/signup" className="btn-solid">Sign up</Link>
        </div>
      </nav>
    </>
  );
}