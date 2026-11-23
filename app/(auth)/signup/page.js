'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconBrandGoogle } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '@/components/toast/ToastProvider';
import PasswordField from '@/components/auth/PasswordField';
import { MIN_PASSWORD_LENGTH, passwordProblem } from '@/lib/password-policy';

const currentYear = new Date().getFullYear();
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

export default function Signup() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState(null);

  const dobInvalid = problem?.field === 'dob' && (!dobMonth || !dobDay || !dobYear);

  const reportProblem = (field, message, focusId = field) => {
    setProblem({ field, message });
    toast.error(message);
    document.getElementById(focusId)?.focus();
  };

  const clearProblem = (field) => {
    setProblem((current) => (current && current.field === field ? null : current));
  };

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) toast.error('We could not start Google sign-up. Please try again.');
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    toast.clear();
    setProblem(null);

    if (!email.trim() || !password) {
      reportProblem(!email.trim() ? 'email' : 'password', 'Please enter your email and password.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      reportProblem('email', 'Please enter a valid email address.');
      return;
    }

    const passwordIssue = passwordProblem(password);
    if (passwordIssue) {
      reportProblem('password', passwordIssue);
      return;
    }

    // client-side plausibility gate only — real 13/16 threshold enforced server-side
    if (!dobMonth || !dobDay || !dobYear) {
      reportProblem(
        'dob',
        'Please enter your date of birth.',
        !dobMonth ? 'dob-month' : !dobDay ? 'dob-day' : 'dob-year'
      );
      return;
    }

    if (!tosAccepted) {
      reportProblem('tos', 'Please confirm you agree to the Terms and Privacy Policy.', 'tosgate');
      return;
    }

    const dateOfBirth = `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`;

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          dateOfBirth,
          tosAccepted
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong. Please try again.');
        return;
      }

      router.push('/check-email');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-panel-body">
      <div className="auth-form-inner">
        <h1 className="auth-title">Create account</h1>
        <div className="auth-sub">Drop your first pin and start sharing the places you love.</div>

        <button className="oauth-btn" onClick={handleGoogleSignup}>
          <IconBrandGoogle size={18} stroke={2} aria-hidden="true" />
          Sign up with Google
        </button>

        <div className="divider">
          <div className="div-line"></div>
          <div className="div-text">or</div>
          <div className="div-line"></div>
        </div>

        {/* Get rid of 'or phone' */}
        <form onSubmit={handleEmailSignup} noValidate>
          <div className="field-wrap">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearProblem('email');
              }}
              autoComplete="email"
              aria-required="true"
              aria-invalid={problem?.field === 'email' ? 'true' : undefined}
              aria-describedby={problem?.field === 'email' ? 'email-error' : undefined}
            />
            {problem?.field === 'email' && (
              <span id="email-error" className="sr-only">{problem.message}</span>
            )}
          </div>
          <PasswordField
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearProblem('password');
            }}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            autoComplete="new-password"
            required
            ariaInvalid={problem?.field === 'password'}
            describedBy={problem?.field === 'password' ? 'password-error' : undefined}
          />
          {problem?.field === 'password' && (
            <span id="password-error" className="sr-only">{problem.message}</span>
          )}

          <fieldset className="field-wrap dob-fieldset">
            <legend className="field-label">Date of birth</legend>
            <div className="dob-row">
              <label htmlFor="dob-month" className="sr-only">Month</label>
              <select
                id="dob-month"
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}
                aria-required="true"
                aria-invalid={problem?.field === 'dob' && !dobMonth ? 'true' : undefined}
                aria-describedby={dobInvalid ? 'dob-error' : undefined}
              >
                <option value="">Month</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <label htmlFor="dob-day" className="sr-only">Day</label>
              <select
                id="dob-day"
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}
                aria-required="true"
                aria-invalid={problem?.field === 'dob' && !dobDay ? 'true' : undefined}
                aria-describedby={dobInvalid ? 'dob-error' : undefined}
              >
                <option value="">Day</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <label htmlFor="dob-year" className="sr-only">Year</label>
              <select
                id="dob-year"
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}
                aria-required="true"
                aria-invalid={problem?.field === 'dob' && !dobYear ? 'true' : undefined}
                aria-describedby={dobInvalid ? 'dob-error' : undefined}
              >
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {dobInvalid && <span id="dob-error" className="sr-only">{problem.message}</span>}
          </fieldset>

          <div className="age-row">
            <input
              type="checkbox"
              id="tosgate"
              checked={tosAccepted}
              onChange={(e) => {
                setTosAccepted(e.target.checked);
                clearProblem('tos');
              }}
              aria-required="true"
              aria-invalid={problem?.field === 'tos' ? 'true' : undefined}
              aria-describedby={problem?.field === 'tos' ? 'tos-error' : undefined}
            />
            <label className="age-text" htmlFor="tosgate">
              I agree to Roam's{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer">Terms</Link> and <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
            </label>
            {problem?.field === 'tos' && (
              <span id="tos-error" className="sr-only">{problem.message}</span>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link href="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}