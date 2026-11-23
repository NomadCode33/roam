'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/toast/ToastProvider';

const currentYear = new Date().getFullYear();
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

const NO_ERRORS = { month: false, day: false, year: false, tos: false };

export default function AgeGate() {
  const router = useRouter();
  const toast = useToast();
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [invalid, setInvalid] = useState(NO_ERRORS);
  const [loading, setLoading] = useState(false);

  const dobInvalid = invalid.month || invalid.day || invalid.year;

  const clearInvalid = (key) => setInvalid((current) => ({ ...current, [key]: false }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.clear();

    const missing = { month: !dobMonth, day: !dobDay, year: !dobYear, tos: false };
    if (missing.month || missing.day || missing.year) {
      setInvalid(missing);
      toast.error('Please enter your date of birth.');
      const firstId = missing.month ? 'dob-month' : missing.day ? 'dob-day' : 'dob-year';
      document.getElementById(firstId)?.focus();
      return;
    }

    if (!tosAccepted) {
      setInvalid({ ...NO_ERRORS, tos: true });
      toast.error('Please confirm you agree to the Terms and Privacy Policy.');
      document.getElementById('tosgate')?.focus();
      return;
    }

    setInvalid(NO_ERRORS);

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
        toast.error(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      router.replace('/');
      router.refresh();
    } catch {
      toast.error('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-panel-body">
      <div className="auth-form-inner">
        <h1 className="auth-title">One more thing</h1>
        <div className="auth-sub">We need a couple details before you continue.</div>

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="field-wrap dob-fieldset">
            <legend className="field-label">Date of birth</legend>
            <div className="dob-row">
              <label htmlFor="dob-month" className="sr-only">Month</label>
              <select
                id="dob-month"
                value={dobMonth}
                onChange={(e) => {
                  setDobMonth(e.target.value);
                  clearInvalid('month');
                }}
                aria-required="true"
                aria-invalid={invalid.month ? 'true' : undefined}
                aria-describedby={dobInvalid ? 'dob-error' : undefined}
              >
                <option value="">Month</option>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <label htmlFor="dob-day" className="sr-only">Day</label>
              <select
                id="dob-day"
                value={dobDay}
                onChange={(e) => {
                  setDobDay(e.target.value);
                  clearInvalid('day');
                }}
                aria-required="true"
                aria-invalid={invalid.day ? 'true' : undefined}
                aria-describedby={dobInvalid ? 'dob-error' : undefined}
              >
                <option value="">Day</option>
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <label htmlFor="dob-year" className="sr-only">Year</label>
              <select
                id="dob-year"
                value={dobYear}
                onChange={(e) => {
                  setDobYear(e.target.value);
                  clearInvalid('year');
                }}
                aria-required="true"
                aria-invalid={invalid.year ? 'true' : undefined}
                aria-describedby={dobInvalid ? 'dob-error' : undefined}
              >
                <option value="">Year</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {dobInvalid && <span id="dob-error" className="sr-only">Choose a month, day and year.</span>}
          </fieldset>

          <div className="age-row">
            <input
              type="checkbox"
              id="tosgate"
              checked={tosAccepted}
              onChange={(e) => {
                setTosAccepted(e.target.checked);
                clearInvalid('tos');
              }}
              aria-required="true"
              aria-invalid={invalid.tos ? 'true' : undefined}
              aria-describedby={invalid.tos ? 'tos-error' : undefined}
            />
            <label className="age-text" htmlFor="tosgate">
              I agree to Roam's{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer">Terms</Link> and <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
            </label>
            {invalid.tos && <span id="tos-error" className="sr-only">Check this box to continue.</span>}
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}