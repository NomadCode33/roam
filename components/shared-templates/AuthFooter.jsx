import Link from 'next/link';

export default function AuthFooter() {
  return (
    <footer className="auth-footer">
      <div className="auth-footer-logo">Roam</div>
      <div className="footer-links">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/">About</Link>
      </div>
      <div className="footer-copy">© 2026 Roam</div>
    </footer>
  );
}