'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IconBrandGoogle } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) setError(error.message);
    //console.log('Google login disabled temporarily');
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!ageConfirmed) {
      setError('Please confirm you meet the age requirement and agree to the Terms.');
      return;
    }

    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) setError(error.message);
    //console.log('Email login disabled temporarily');
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

          <div className="age-row">
            <input
              type="checkbox"
              id="agegate"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              required
            />
            <label className="age-text" htmlFor="agegate">
              I confirm I am 13 years or older (16 if in the EU). I agree to Roam's{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer">Terms</Link> and <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
            </label>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="submit-btn">Create account</button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link href="/login">Log in</Link>
        </div>
      </div>
    </main>
  );
}