'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconBrandGoogle } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '@/components/toast/ToastProvider';
import { requestResend } from '@/lib/resend-confirmation';
import { useCooldown } from '@/lib/use-cooldown';

function loginMessage(error) {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Incorrect email or password.';
    case 'email_not_confirmed':
      return 'Please confirm your email first. Check your inbox and spam folder for the link.';
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a few minutes and try again.';
    default:
      return 'We could not sign you in. Please try again.';
  }
}

export default function Login() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [resending, setResending] = useState(false);
  const { secondsLeft: resendWait, start: startResendWait } = useCooldown('resend-confirmation');

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) toast.error('We could not start Google sign-in. Please try again.');
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    toast.clear();

    if (!email.trim() || !password) {
      toast.error('Please enter your email and password.');
      return;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setNeedsConfirm(error.code === 'email_not_confirmed');
        toast.error(loginMessage(error));
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    toast.clear();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setResending(true);
    const result = await requestResend(email.trim());
    setResending(false);
    if (result.ok) {
      toast.success(result.message);
      startResendWait();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="auth-panel-body">
      <div className="auth-form-inner">
        <div className="auth-title">Log in</div>
        <div className="auth-sub">Continue to see what's new on the map.</div>

        <button className="oauth-btn" onClick={handleGoogleLogin}>
          <IconBrandGoogle size={18} stroke={2} aria-hidden="true" />
          Continue with Google
        </button>

        <div className="divider">
          <div className="div-line"></div>
          <div className="div-text">or</div>
          <div className="div-line"></div>
        </div>

        <form onSubmit={handleEmailLogin} noValidate>
          <div className="field-wrap">
            <label className="field-label" htmlFor="email">Email or phone</label>
            <input
              id="email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="field-wrap">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <Link href="/forgot-password" className="forgot">Forgot password?</Link>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          {needsConfirm && (
            <button type="button" className="oauth-btn" onClick={handleResend} disabled={resending || resendWait > 0}>
              {resending
                ? 'Sending...'
                : resendWait > 0
                  ? `Resend available in ${resendWait}s`
                  : 'Resend confirmation email'}
            </button>
          )}
        </form>

        <div className="auth-switch">
          Don't have an account? <Link href="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  )
}