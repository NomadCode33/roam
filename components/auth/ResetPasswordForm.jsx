'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/toast/ToastProvider';
import { MIN_PASSWORD_LENGTH, passwordProblem } from '@/lib/password-policy';
import PasswordField from '@/components/auth/PasswordField';

function updateMessage(error) {
  switch (error.code) {
    case 'same_password':
      return 'Please choose a password different from your current one.';
    case 'weak_password':
      return 'Please choose a stronger password.';
    case 'reauthentication_needed':
      return 'For your security, please request a new reset link and try again.';
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
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const busy = loading || leaving;

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

  const handleCancel = async () => {
    toast.clear();
    setLeaving(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        toast.error('We could not cancel right now. Please try again.');
        setLeaving(false);
        return;
      }
      router.replace('/login');
    } catch {
      toast.error('Network error. Please try again.');
      setLeaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PasswordField
        id="new-password"
        label="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        autoComplete="new-password"
        visible={showPasswords}
        showToggle={false}
      />
      <PasswordField
        id="confirm-password"
        label="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Type it again"
        autoComplete="new-password"
        visible={showPasswords}
        onVisibleChange={setShowPasswords}
      />
      <div className="auth-actions">
        <button type="button" className="cancel-btn" onClick={handleCancel} disabled={busy}>
          {leaving ? 'Cancelling...' : 'Cancel'}
        </button>
        <button type="submit" className="submit-btn" disabled={busy}>
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </div>
      <p className="auth-help">Cancel signs you out without changing your password.</p>
    </form>
  );
}