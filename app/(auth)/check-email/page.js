import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Check your email | Roam' };

export default async function CheckEmail() {
  const cookieStore = await cookies();
  if (!cookieStore.has('roam_check_email')) {
    redirect('/signup');
  }

  return (
    <div className="auth-panel-body">
      <div className="auth-form-inner">
        <h1 className="auth-title">Check your email</h1>
        <p className="auth-sub">
          We sent a confirmation link to your inbox. Open it to finish creating your account.
        </p>
        <ul className="check-email-list">
          <li>Don&apos;t see it? Check your spam or junk folder.</li>
          <li>Add <strong>roamnoreply@gmail.com</strong> to your contacts or safe senders.</li>
          <li>The link works once.</li>
        </ul>
        <div className="auth-switch">
          Used the wrong email? <Link href="/signup">Sign up again</Link>
        </div>
      </div>
    </div>
  );
}