'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/toast/ToastProvider';
import { requestPasswordReset } from '@/lib/request-password-reset';
import { useCooldown, cooldownMessage } from '@/lib/use-cooldown';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { secondsLeft, start } = useCooldown('forgot-password');
  const counting = secondsLeft > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.clear();

    if (counting) {
      toast.info(cooldownMessage(secondsLeft));
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const result = await requestPasswordReset(email.trim());
    setLoading(false);

    if (result.ok) {
      toast.success(result.message);
      start();
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
          <button
            type="submit"
            className={counting ? 'submit-btn is-cooling' : 'submit-btn'}
            disabled={loading}
            aria-disabled={counting || undefined}
          >
            {loading
              ? 'Sending...'
              : counting
                ? `Send again in ${secondsLeft}s`
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