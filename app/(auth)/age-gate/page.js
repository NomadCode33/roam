'use client';

import { useState } from 'react';
import Link from 'next/link';

const currentYear = new Date().getFullYear();
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

export default function AgeGate() {
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      const res = await fetch('/api/auth/age-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateOfBirth, tosAccepted })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      window.location.href = '/';
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="auth-panel-body">
      <div className="auth-form-inner">
        <div className="auth-title">One more thing</div>
        <div className="auth-sub">We need a couple details before you continue.</div>

        <form onSubmit={handleSubmit}>
          <div className="field-wrap">
            <label className="field-label">Date of birth</label>
            <div className="dob-row">
              <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} required>
                <option value="">Month</option>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={dobDay} onChange={(e) => setDobDay(e.target.value)} required>
                <option value="">Day</option>
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={dobYear} onChange={(e) => setDobYear(e.target.value)} required>
                <option value="">Year</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
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
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  );
}