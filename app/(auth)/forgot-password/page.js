'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/toast/ToastProvider';
import { requestPasswordReset } from '@/lib/request-password-reset';

const COOLDOWN_SECONDS = 60;

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const counting = cooldown > 0;

  useEffect(() => {
    if (!counting) return;
    const timer = setInterval(() => {
      setCooldown((seconds) => seconds - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [counting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.clear();

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const result = await requestPasswordReset(email.trim());
    setLoading(false);

    if (result.ok) {
      toast.success(result.message);
      setCooldown(COOLDOWN_SECONDS);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="auth-panel-body">
      <div className="auth-form-inner">
        <h1 className="auth-title">Reset your password</h1>
        <p className="auth-sub">
          Enter the email you signed up with and we will send you a link to choose a new password.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-wrap">
            <label className="field-label" htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading || counting}>
            {loading
              ? 'Sending...'
              : counting
                ? `Send again in ${cooldown}s`
                : 'Send reset link'}
          </button>
        </form>

        <div className="auth-switch">
          Remembered it? <Link href="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}