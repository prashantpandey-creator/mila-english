'use client';

import { useEffect, useState } from 'react';
import { useProduct } from '@/lib/product-context';
import '../auth-recovery.css';

export default function VerifyEmailPage() {
  const product = useProduct();
  const isGia = product === 'gia';
  const brand = isGia ? 'Gia' : 'Mila';
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
    <p>{state === 'verified' ? `Your ${brand} account is ready across devices.` : state === 'error' ? message : `${brand} is checking this private link.`}</p>
    <a className="auth-recovery__back" href={state === 'verified' ? (isGia ? '/chat' : '/account') : '/forgot-password'}>{state === 'verified' ? `Continue to ${brand}` : 'Request another link'}</a>
  </section></main>;
}
