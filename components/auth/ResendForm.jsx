'use client';

import { useState } from 'react';
import { useToast } from '@/components/toast/ToastProvider';
import { requestResend } from '@/lib/resend-confirmation';
import { useCooldown, cooldownMessage } from '@/lib/use-cooldown';

export default function ResendForm() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { secondsLeft, start } = useCooldown('resend-confirmation');
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
    const result = await requestResend(email.trim());
    setLoading(false);

    if (result.ok) {
      toast.success(result.message);
      start();
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
      <button
        type="submit"
        className={counting ? 'submit-btn is-cooling' : 'submit-btn'}
        disabled={loading}
        aria-disabled={counting || undefined}
      >
        {loading
          ? 'Sending...'
          : counting
            ? `Resend available in ${secondsLeft}s`
            : 'Resend confirmation email'}
      </button>
    </form>
  );
}