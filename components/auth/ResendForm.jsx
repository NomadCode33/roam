'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/toast/ToastProvider';
import { requestResend } from '@/lib/resend-confirmation';

const COOLDOWN_SECONDS = 60;

export default function ResendForm() {
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
    const result = await requestResend(email.trim());
    setLoading(false);

    if (result.ok) {
      toast.success(result.message);
      setCooldown(COOLDOWN_SECONDS);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field-wrap">
        <label className="field-label" htmlFor="resend-email">
          Send the link again
        </label>
        <input
          id="resend-email"
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
            ? `Resend available in ${cooldown}s`
            : 'Resend confirmation email'}
      </button>
    </form>
  );
}