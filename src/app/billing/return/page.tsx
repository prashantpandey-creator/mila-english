'use client';

import { useEffect, useState } from 'react';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import '../../account/account.css';

type State = 'checking' | 'paid' | 'pending' | 'canceled' | 'error';

export default function BillingReturnPage() {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    const purchase = new URLSearchParams(window.location.search).get('purchase') || '';
    if (!purchase) { setState('error'); return; }
    let stopped = false;
    let attempts = 0;
    let timer: number | undefined;
    const retryOrFail = () => {
      if (stopped) return;
      if (attempts < 6) timer = window.setTimeout(check, 1500);
      else setState('error');
    };
    async function check() {
      attempts += 1;
      try {
        const response = await fetch(`/api/billing/status?purchase=${encodeURIComponent(purchase)}`, { cache: 'no-store' });
        if (!response.ok) { retryOrFail(); return; }
        const body = await response.json();
        const status = body?.purchase?.status;
        if (stopped) return;
        if (status === 'paid') setState('paid');
        else if (status === 'canceled' || status === 'refunded') setState('canceled');
        else if (status === 'created' || status === 'pending') {
          if (attempts < 6) timer = window.setTimeout(check, 1500);
          else setState('pending');
        } else setState('error');
      } catch {
        retryOrFail();
      }
    }
    void check();
    return () => { stopped = true; if (timer) window.clearTimeout(timer); };
  }, []);

  const content = state === 'paid' ? {
    title: 'Mila Pro is ready.', copy: 'Your verified 30-day access is active on this account.', action: '/dashboard', label: 'Continue to Mila',
  } : state === 'canceled' ? {
    title: 'No access was activated.', copy: 'The payment was canceled or refunded. You can continue with Mila Free.', action: '/pricing', label: 'Return to plans',
  } : state === 'pending' ? {
    title: 'Payment is still being verified.', copy: 'Some banks take a little longer. Your access activates only after YooKassa confirms the payment.', action: '/account', label: 'Check my account',
  } : state === 'error' ? {
    title: 'We could not match this return.', copy: 'No charge is trusted from a browser redirect. Check your account or contact Mila support.', action: '/support', label: 'Get support',
  } : {
    title: 'Confirming your payment…', copy: 'Mila is checking the payment directly with YooKassa.', action: '', label: '',
  };

  return (
    <AppShell className="account-page">
      <AppHeader backHref="/" title="Payment" />
      <AppMain width="compact" centered className="account-page__main">
        <section className="account-hero" aria-live="polite">
          <p className="account-hero__kicker">SECURE CHECKOUT</p>
          <h1>{content.title}</h1>
          <p>{content.copy}</p>
          {content.action ? <div className="account-actions"><a className="account-button account-button--primary" href={content.action}>{content.label}</a></div> : null}
        </section>
      </AppMain>
    </AppShell>
  );
}
