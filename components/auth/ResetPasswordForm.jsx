'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/toast/ToastProvider';
import { MIN_PASSWORD_LENGTH, passwordProblem } from '@/lib/password-policy';

function updateMessage(error) {
  switch (error.code) {
    case 'same_password':
      return 'Please choose a password different from your current one.';
    case 'weak_password':
      return 'Please choose a stronger password.';
    case 'session_expired':
    case 'session_not_found':
      return 'This link has expired. Please request a new one.';
    default:
      return 'We could not update your password. Please try again.';
  }
}

export default function ResetPasswordForm() {
  const toast = useToast();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.clear();

    const problem = passwordProblem(password);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (password !== confirm) {
      toast.error('The two passwords do not match.');
      return;
    }

    setLoading(true);
    let succeeded = false;
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(updateMessage(error));
        return;
      }
      succeeded = true;
      await supabase.auth.signOut({ scope: 'global' });
      router.replace('/login?notice=password_updated');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      if (!succeeded) setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field-wrap">
        <label className="field-label" htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div className="field-wrap">
        <label className="field-label" htmlFor="confirm-password">Confirm new password</label>
        <input
          id="confirm-password"
          type="password"
          placeholder="Type it again"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Updating...' : 'Update password'}
      </button>
    </form>
  );
}