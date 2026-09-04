'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IconBrandGoogle } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

const currentYear = new Date().getFullYear();
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) setError(error.message);
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');

    // client-side plausibility gate only — real 13/16 threshold enforced server-side
    if (!dobMonth || !dobDay || !dobYear) {
      setError('Please enter your date of birth.');
      return;
    }

    if (!tosAccepted) {
      setError('Please confirm you agree to the Terms and Privacy Policy.');
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
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      window.location.href = '/auth/callback';
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="auth-panel-body">
      <div className="auth-form-inner">
        <div className="auth-title">Create account</div>
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

        <form onSubmit={handleEmailSignup}>
          <div className="field-wrap">
            <label className="field-label" htmlFor="email">Email or phone</label>
            <input
              id="email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field-wrap">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="field-wrap">
            <label className="field-label">Date of birth</label>
            <div className="dob-row">
              <select
                id="dob-month"
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}
                required
              >
                <option value="">Month</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                id="dob-day"
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}
                required
              >
                <option value="">Day</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                id="dob-year"
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}
                required
              >
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="age-row">
            <input
              type="checkbox"
              id="tosgate"
              checked={tosAccepted}
              onChange={(e) => setTosAccepted(e.target.checked)}
              required
            />
            <label className="age-text" htmlFor="tosgate">
              I agree to Roam's{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer">Terms</Link> and <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
            </label>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link href="/login">Log in</Link>
        </div>
      </div>
    </main>
  );
}