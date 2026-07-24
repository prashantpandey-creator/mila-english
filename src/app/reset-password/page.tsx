'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProduct } from '@/lib/product-context';
import '../auth-recovery.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const product = useProduct();
  const isGia = product === 'gia';
  const brand = isGia ? 'Gia' : 'FluentMitra';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
    setToken(value);
    window.history.replaceState(null, '', '/reset-password');
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
    const body = await response.json().catch(() => null);
    if (response.ok) { router.push(isGia ? '/chat' : '/dashboard'); router.refresh(); return; }
    setError(body?.error || 'This reset link could not be used.'); setBusy(false);
  };
  return <main className="auth-recovery"><section className="auth-recovery__card"><h1>Choose a new password</h1><p>Use at least 8 characters. {brand} signs out older sessions when this password changes.</p><form onSubmit={submit}><label>New password<input type="password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /></label><button disabled={busy || !token}>{busy ? 'Saving…' : 'Save new password'}</button></form>{error ? <p className="auth-recovery__feedback" role="alert">{error}</p> : null}<a className="auth-recovery__back" href="/forgot-password">Request another link</a></section></main>;
}
