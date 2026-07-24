'use client';

import { useState } from 'react';
import { useProduct } from '@/lib/product-context';
import '../auth-recovery.css';

export default function ForgotPasswordPage() {
  const product = useProduct();
  const brand = product === 'gia' ? 'Gia' : 'FluentMitra';
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => null);
    setSent(true); setBusy(false);
  };
  return <main className="auth-recovery"><section className="auth-recovery__card"><h1>Reset your password</h1><p>Enter the email saved with {brand}. If that account exists, {brand} will send a private 30-minute reset link.</p><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><button disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button></form>{sent ? <p className="auth-recovery__feedback" role="status">Check your inbox. For privacy, this message is the same whether an account exists or not.</p> : null}<a className="auth-recovery__back" href="/login">Back to sign in</a></section></main>;
}
