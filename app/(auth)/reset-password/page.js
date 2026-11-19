import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata = { title: 'Choose a new password | Roam' };

export default async function ResetPassword() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="auth-panel-body">
        <div className="auth-form-inner">
          <h1 className="auth-title">This link has expired</h1>
          <p className="auth-sub">
            Password reset links work once and expire after a while. Request a new one to continue.
          </p>
          <div className="auth-switch">
            <Link href="/forgot-password">Request a new link</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-panel-body">
      <div className="auth-form-inner">
        <h1 className="auth-title">Choose a new password</h1>
        <p className="auth-sub">Pick a password you have not used on Roam before.</p>
        <ResetPasswordForm />
      </div>
    </div>
  );
}