'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import { useI18n } from '@/lib/i18n-provider';
import './account.css';

type Account = {
  name: string;
  email: string | null;
  isGuest: boolean;
  emailVerified: boolean;
  nativeLanguage: string;
  level: string | null;
  subscription: { plan: 'free' | 'pro'; status: string; active: boolean; isPaid: boolean; renewsAt: string | null };
};

type Purchase = {
  id: string;
  status: 'created' | 'pending' | 'paid' | 'canceled' | 'refunded' | 'abandoned';
  productCode: string;
  amountMinor: number;
  currency: string;
  paidAt: string | null;
  accessEndsAt: string | null;
};

export default function AccountPage() {
  const { lang } = useI18n();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const T = (ru: string, en: string) => lang === 'ru' ? ru : en;

  useEffect(() => {
    Promise.all([
      fetch('/api/users/me', { cache: 'no-store' }).then((response) => response.ok ? response.json() : Promise.reject()),
      fetch('/api/billing/status', { cache: 'no-store' }).then((response) => response.ok ? response.json() : null),
    ])
      .then(([profile, billing]) => {
        setAccount(profile);
        setPurchase(billing?.purchase || null);
      })
      .catch(() => router.replace('/login?returnTo=/account'))
      .finally(() => setLoading(false));
  }, [router]);

  const signOut = async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('logout failed');
      router.push('/');
      router.refresh();
    } catch {
      setError(T('Не удалось выйти. Проверь соединение и попробуй ещё раз.', 'Could not sign out. Check your connection and try again.'));
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (confirmation !== 'DELETE') return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/users/me', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation }),
      });
      if (!response.ok) throw new Error('deletion failed');
      router.push('/');
      router.refresh();
    } catch {
      setError(T('Не удалось удалить данные. Напиши в поддержку.', 'Could not delete the account. Contact support.'));
      setBusy(false);
    }
  };

  const sendVerification = async () => {
    setBusy(true); setError(''); setVerificationMessage('');
    try {
      const response = await fetch('/api/auth/send-verification', { method: 'POST' });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || 'verification failed');
      setVerificationMessage(T('Письмо отправлено. Открой ссылку в течение 24 часов.', 'Email sent. Open the private link within 24 hours.'));
    } catch (sendError) {
      setError(sendError instanceof Error && sendError.message !== 'verification failed'
        ? sendError.message
        : T('Не удалось отправить письмо.', 'Could not send the verification email.'));
    }
    setBusy(false);
  };

  if (loading || !account) return <div className="account-page" />;
  const pro = account.subscription.isPaid;
  const expiry = account.subscription.renewsAt ? new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-GB', { dateStyle: 'long' }).format(new Date(account.subscription.renewsAt)) : null;

  return (
    <AppShell className="account-page">
      <AppHeader backHref="/dashboard" title={T('Аккаунт', 'Account')} actions={<LangToggle />} />
      <AppMain width="work" className="account-page__main">
        <div className="account-stack">
          <section className="account-hero">
            <p className="account-hero__kicker">{T('ТВОЯ MILA', 'YOUR MILA')}</p>
            <h1>{account.isGuest ? T('Сохрани свой прогресс', 'Keep your progress') : account.name}</h1>
            <p>{account.isGuest
              ? T('Сейчас это приватный гостевой профиль. Создай аккаунт — уроки, уровень и история останутся на месте и будут доступны на других устройствах.', 'This is a private guest profile. Create an account and your lessons, level, and history stay exactly where they are—then follow you to other devices.')
              : T('Здесь живут твой доступ, данные и управление аккаунтом.', 'Your access, data, and account controls live here.')}</p>
            {account.isGuest ? (
              <div className="account-actions"><a className="account-button account-button--primary" href="/register?returnTo=/account">{T('Создать аккаунт', 'Create my account')}</a></div>
            ) : null}
          </section>

          <section className="account-panel">
            <div className="account-panel__row">
              <div>
                <p className="account-panel__kicker">{T('ДОСТУП', 'ACCESS')}</p>
                <h2>{pro ? 'Mila Pro' : T('Бесплатный план', 'Free plan')}</h2>
              </div>
              <span className={`account-plan${pro ? ' is-pro' : ''}`}>{pro ? 'PRO' : 'FREE'}</span>
            </div>
            <p>{pro
              ? T(`Pro активен${expiry ? ` до ${expiry}` : ''}. Автопродления нет.`, `Pro is active${expiry ? ` until ${expiry}` : ''}. It does not renew automatically.`)
              : T('Основные уроки и приватный голос остаются бесплатными. Pro добавляет быстрый живой голос и уроки по твоему запросу.', 'Core lessons and private voice stay free. Pro adds the fast live voice and custom lessons made for your goal.')}</p>
            {purchase && ['created', 'pending'].includes(purchase.status) ? (
              <p className="account-feedback" role="status">{T('Платёж ещё проверяется. Pro включится только после подтверждения ЮKassa.', 'Payment verification is in progress. Pro activates only after YooKassa confirms it.')}</p>
            ) : purchase?.status === 'canceled' ? (
              <p className="account-feedback" role="status">{T('Последняя оплата была отменена. Pro не активирован.', 'The latest payment was canceled. Pro was not activated.')}</p>
            ) : purchase?.status === 'refunded' ? (
              <p className="account-feedback" role="status">{T('Последняя оплата возвращена. Доступ от неё завершён.', 'The latest payment was refunded. Access from it has ended.')}</p>
            ) : null}
            <div className="account-actions">
              <a className="account-button account-button--primary" href="/pricing">{pro ? T('Посмотреть тариф', 'View plan') : T('Открыть Pro', 'See Mila Pro')}</a>
              <a className="account-button" href="/refunds">{T('Оплата и возвраты', 'Payments and refunds')}</a>
            </div>
          </section>

          <section className="account-panel">
            <p className="account-panel__kicker">{T('ПРОФИЛЬ', 'PROFILE')}</p>
            <h2>{T('Данные аккаунта', 'Account details')}</h2>
            <div className="account-details">
              <div className="account-detail"><span>Email</span><strong>{account.isGuest ? T('Гостевой профиль', 'Guest profile') : account.email}</strong></div>
              <div className="account-detail"><span>{T('Уровень', 'Level')}</span><strong>{account.level && account.level !== 'pending' ? account.level.toUpperCase() : T('Ещё не определён', 'Not placed yet')}</strong></div>
              <div className="account-detail"><span>{T('Родной язык', 'Learning language')}</span><strong>{account.nativeLanguage}</strong></div>
              <div className="account-detail"><span>{T('Статус', 'Status')}</span><strong>{account.isGuest ? T('Приватный гость', 'Private guest') : T('Сохранённый аккаунт', 'Saved account')}</strong></div>
              {!account.isGuest ? <div className="account-detail"><span>{T('Статус email', 'Email status')}</span><strong>{account.emailVerified ? T('Подтверждён', 'Verified') : T('Нужно подтвердить', 'Verification needed')}</strong></div> : null}
            </div>
            {!account.isGuest && !account.emailVerified ? <div className="account-delete">
              <p>{T('Подтверди email до покупки Pro — так доступ и чек нельзя потерять из-за опечатки.', 'Verify your email before buying Pro so access and receipts cannot be lost to a typo.')}</p>
              <button className="account-button account-button--primary" type="button" onClick={sendVerification} disabled={busy}>{T('Отправить письмо', 'Send verification email')}</button>
              {verificationMessage ? <p className="account-feedback" role="status">{verificationMessage}</p> : null}
            </div> : null}
            <div className="account-actions">
              {!account.isGuest ? <a className="account-button" href="/forgot-password">{T('Сменить пароль', 'Reset password')}</a> : null}
              <button className="account-button" type="button" onClick={signOut} disabled={busy}>{T('Выйти', 'Sign out')}</button>
            </div>

            <div className="account-delete">
              {!confirmingDelete ? (
                <button className="account-button account-button--danger" type="button" onClick={() => setConfirmingDelete(true)}>{account.isGuest ? T('Удалить гостевые данные', 'Delete guest data') : T('Удалить аккаунт и данные', 'Delete account and data')}</button>
              ) : (
                <>
                  <p>{T('Это навсегда удалит обучение, прогресс и историю. Введи DELETE для подтверждения. Финансовая запись об оплате может храниться отдельно, если этого требует закон.', 'This permanently deletes learning data, progress, and history. Type DELETE to confirm. A payment record may be retained separately where legally required.')}</p>
                  <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="DELETE" aria-label="Type DELETE to confirm" />
                  <div className="account-actions">
                    <button className="account-button account-button--danger" type="button" onClick={deleteAccount} disabled={busy || confirmation !== 'DELETE'}>{T('Удалить навсегда', 'Delete permanently')}</button>
                    <button className="account-button" type="button" onClick={() => { setConfirmingDelete(false); setConfirmation(''); }}>{T('Отмена', 'Cancel')}</button>
                  </div>
                </>
              )}
              {error ? <p className="account-feedback" role="alert">{error}</p> : null}
            </div>
          </section>
        </div>
      </AppMain>
    </AppShell>
  );
}
