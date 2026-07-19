'use client';

import { useEffect, useState } from 'react';
import '../auth-recovery.css';

export default function VerifyEmailPage() {
  const [state, setState] = useState<'checking' | 'verified' | 'error'>('checking');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
    // Fragments never reach the server; remove this one before the learner can
    // copy the URL or navigate elsewhere.
    window.history.replaceState(null, '', '/verify-email');
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || 'This link could not be used.');
      setState('verified');
    }).catch((error) => {
      setMessage(error instanceof Error ? error.message : 'This link could not be used.');
      setState('error');
    });
  }, []);

  return <main className="auth-recovery"><section className="auth-recovery__card">
    <h1>{state === 'verified' ? 'Email verified' : state === 'error' ? 'Link not verified' : 'Verifying your email…'}</h1>
    <p>{state === 'verified' ? 'Your Mila account is ready for paid access and cross-device recovery.' : state === 'error' ? message : 'Mila is checking this private link.'}</p>
    <a className="auth-recovery__back" href={state === 'verified' ? '/account' : '/account'}>{state === 'verified' ? 'Continue to my account' : 'Request another link'}</a>
  </section></main>;
}
