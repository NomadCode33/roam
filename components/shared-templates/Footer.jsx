import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-logo">Roam</div>
      <div className="site-footer-links">
        <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy</Link>
        <Link href="/terms" target="_blank" rel="noopener noreferrer">Terms</Link>
        <Link href="#">About</Link>
      </div>
      <div className="site-footer-copy">© 2026 Roam</div>
    </footer>
  );
}