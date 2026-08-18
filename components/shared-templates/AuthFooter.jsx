import Link from 'next/link';

export default function AuthFooter() {
  return (
    <footer className="auth-footer">
      <Link href="/" className="auth-footer-logo">Roam</Link>
      <div className="footer-links">
        <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy</Link>
        <Link href="/terms" target="_blank" rel="noopener noreferrer">Terms</Link>
        <Link href="#">About</Link>
      </div>
      <div className="footer-copy">© 2026 Roam</div>
    </footer>
  );
}