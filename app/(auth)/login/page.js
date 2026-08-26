'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IconBrandGoogle } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) setError(error.message);
    //console.log('Google login disabled temporarily');
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    //console.log('Email login disabled temporarily');
  };

  return (
    <main className="auth-panel-body">
      <div className="auth-form-inner">
        <div className="auth-title">Log in</div>
        <div className="auth-sub">Continue to see what's new on the map.</div>

        <button className="oauth-btn" onClick={handleGoogleLogin}>
          <IconBrandGoogle size={18} stroke={2} aria-hidden="true" />
          Continue with Google
        </button>

        <div className="divider">
          <div className="div-line"></div>
          <div className="div-text">or</div>
          <div className="div-line"></div>
        </div>

        <form onSubmit={handleEmailLogin}>
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <Link href="#" className="forgot">Forgot password?</Link>
          <button type="submit" className="submit-btn">Sign in</button>
        </form>

        <div className="auth-switch">
          Don't have an account? <Link href="/signup">Sign up</Link>
        </div>
      </div>
    </main>
  )
}