'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/toast/ToastProvider';

const MESSAGES = {
  signup_disabled: 'Sign-ups are closed right now. Please check back soon.',
  otp_expired: 'That link has expired or was already used. Request a new one and try again.',
  access_denied: 'Sign-in was cancelled. You can try again whenever you are ready.',
  exchange_failed: 'We could not complete that sign-in. Please try again.',
};
const FALLBACK = 'Something went wrong. Please try again.';
const ERROR_KEYS = ['error', 'error_code', 'error_description'];

function messageFor(code, error) {
  // A specific code decides the message. Never fall back to the broad error key
  // when a code is present: Supabase uses error=access_denied for several failures.
  if (code) return Object.hasOwn(MESSAGES, code) ? MESSAGES[code] : FALLBACK;
  if (error && Object.hasOwn(MESSAGES, error)) return MESSAGES[error];
  return FALLBACK;
}

export default function AuthErrorReader() {
  const toast = useToast();

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const query = new URLSearchParams(window.location.search);

    const inHash = hash.has('error') || hash.has('error_code');
    const inQuery = query.has('error') || query.has('error_code');
    if (!inHash && !inQuery) return;

    const source = inHash ? hash : query;
    toast.error(messageFor(source.get('error_code'), source.get('error')));

    // Remove the error from the address bar so a refresh does not repeat it
    const url = new URL(window.location.href);
    if (inHash) url.hash = '';
    ERROR_KEYS.forEach((key) => url.searchParams.delete(key));
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, [toast]);

  return null;
}